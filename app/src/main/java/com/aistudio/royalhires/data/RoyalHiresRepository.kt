package com.aistudio.royalhires.data

import com.aistudio.royalhires.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.text.SimpleDateFormat
import java.util.*

class RoyalHiresRepository {
    private val _users = MutableStateFlow(SampleData.users)
    val users: StateFlow<List<User>> = _users.asStateFlow()

    private val _currentUser = MutableStateFlow(SampleData.users.first())
    val currentUser: StateFlow<User> = _currentUser.asStateFlow()

    private val _factories = MutableStateFlow(SampleData.factories)
    val factories: StateFlow<List<Factory>> = _factories.asStateFlow()

    private val _employees = MutableStateFlow(SampleData.employees)
    val employees: StateFlow<List<Employee>> = _employees.asStateFlow()

    private val _boardingLocations = MutableStateFlow(SampleData.boardingLocations)
    val boardingLocations: StateFlow<List<BoardingLocation>> = _boardingLocations.asStateFlow()

    private val _attendance = MutableStateFlow(SampleData.attendance)
    val attendance: StateFlow<List<AttendanceRecord>> = _attendance.asStateFlow()

    private val _payrollRuns = MutableStateFlow(SampleData.payrollRuns)
    val payrollRuns: StateFlow<List<PayrollRun>> = _payrollRuns.asStateFlow()

    private val _invoices = MutableStateFlow(SampleData.invoices)
    val invoices: StateFlow<List<FactoryInvoice>> = _invoices.asStateFlow()

    private val _receipts = MutableStateFlow(SampleData.receipts)
    val receipts: StateFlow<List<FactoryReceipt>> = _receipts.asStateFlow()

    private val _auditLogs = MutableStateFlow(SampleData.auditLogs)
    val auditLogs: StateFlow<List<AuditLog>> = _auditLogs.asStateFlow()

    private val _isOnline = MutableStateFlow(true)
    val isOnline: StateFlow<Boolean> = _isOnline.asStateFlow()

    fun setCurrentUser(user: User) {
        _currentUser.value = user
        logAudit("SWITCH_USER", "Switched active user to ${user.name} (${user.role.label})")
    }

    fun toggleOnline() {
        _isOnline.value = !_isOnline.value
    }

    private fun logAudit(action: String, details: String) {
        val user = _currentUser.value
        val now = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()).format(Date())
        val newLog = AuditLog(
            id = "aud-${System.currentTimeMillis()}",
            timestamp = now,
            actor = user.name,
            role = user.role.label,
            action = action,
            details = details
        )
        _auditLogs.value = listOf(newLog) + _auditLogs.value
    }

    // Attendance Operations
    fun saveAttendance(record: AttendanceRecord) {
        val currentList = _attendance.value.toMutableList()
        val index = currentList.indexOfFirst { it.id == record.id }
        if (index >= 0) {
            currentList[index] = record
        } else {
            currentList.add(0, record)
        }
        _attendance.value = currentList
        logAudit("RECORD_ATTENDANCE", "Logged attendance for ${record.employeeName} at ${record.factoryName}")
    }

    fun approveOvertime(attendanceId: String, approve: Boolean) {
        val currentList = _attendance.value.toMutableList()
        val index = currentList.indexOfFirst { it.id == attendanceId }
        if (index >= 0) {
            val record = currentList[index]
            val newStatus = if (approve) SubmissionStatus.APPROVED else SubmissionStatus.REJECTED
            currentList[index] = record.copy(submissionStatus = newStatus)
            _attendance.value = currentList
            val actionName = if (approve) "APPROVE_OVERTIME" else "REJECT_OVERTIME"
            logAudit(actionName, "${if (approve) "Approved" else "Rejected"} ${record.otHours}h OT for ${record.employeeName}")
        }
    }

    // Factory Operations
    fun saveFactory(factory: Factory) {
        val currentList = _factories.value.toMutableList()
        val index = currentList.indexOfFirst { it.id == factory.id }
        if (index >= 0) {
            currentList[index] = factory
        } else {
            currentList.add(factory)
        }
        _factories.value = currentList
        logAudit("SAVE_FACTORY", "Updated factory details for ${factory.name}")
    }

    // Employee Operations
    fun saveEmployee(employee: Employee) {
        val currentList = _employees.value.toMutableList()
        val index = currentList.indexOfFirst { it.id == employee.id }
        if (index >= 0) {
            currentList[index] = employee
        } else {
            currentList.add(employee)
        }
        _employees.value = currentList
        logAudit("SAVE_EMPLOYEE", "Saved helper record for ${employee.fullName} (${employee.id})")
    }

    // Boarding Operations
    fun saveBoarding(boarding: BoardingLocation) {
        val currentList = _boardingLocations.value.toMutableList()
        val index = currentList.indexOfFirst { it.id == boarding.id }
        if (index >= 0) {
            currentList[index] = boarding
        } else {
            currentList.add(boarding)
        }
        _boardingLocations.value = currentList
        logAudit("SAVE_BOARDING", "Updated boarding quarters ${boarding.name}")
    }

    // Generate Payroll Run
    fun generatePayrollRun(periodStart: String, periodEnd: String) {
        val activeEmployees = _employees.value.filter { it.status == "active" }
        val attRecords = _attendance.value.filter { it.date in periodStart..periodEnd }

        val items = activeEmployees.map { emp ->
            val empAttendance = attRecords.filter { it.employeeId == emp.id }
            val daysWorked = empAttendance.sumOf { it.payableUnits }
            val normalWage = daysWorked * emp.wageRate

            // Only approved overtime is paid
            val approvedOtHours = empAttendance
                .filter { it.submissionStatus == SubmissionStatus.APPROVED }
                .sumOf { it.otHours }

            val factory = _factories.value.find { it.id == emp.currentFactoryId }
            val otRate = factory?.employeeOvertimeRateHourly ?: 350.0
            val otWage = approvedOtHours * otRate
            val gross = normalWage + otWage

            val mealCost = if (emp.eligibleForMeals && factory != null) {
                val breakfast = empAttendance.count { it.hadBreakfast } * factory.breakfastRate
                val lunch = empAttendance.count { it.hadLunch } * factory.lunchRate
                val dinner = empAttendance.count { it.hadDinner } * factory.dinnerRate
                breakfast + lunch + dinner
            } else 0.0

            val boarding = _boardingLocations.value.find { it.id == emp.boardingLocationId }
            val boardingCost = if (emp.eligibleForBoarding && boarding != null) {
                empAttendance.count { it.hadBoarding } * boarding.dailyRate
            } else 0.0

            val advances = 0.0
            val net = (gross - mealCost - boardingCost - advances).coerceAtLeast(0.0)

            PayrollItem(
                id = "pi-${emp.id}-${System.currentTimeMillis()}",
                employeeId = emp.id,
                employeeName = emp.fullName,
                daysWorked = daysWorked,
                normalWage = normalWage,
                approvedOtHours = approvedOtHours,
                otWage = otWage,
                grossEarnings = gross,
                mealDeductions = mealCost,
                boardingDeductions = boardingCost,
                advancesDeducted = advances,
                netPayable = net
            )
        }

        val totalGross = items.sumOf { it.grossEarnings }
        val totalDeductions = items.sumOf { it.mealDeductions + it.boardingDeductions + it.advancesDeducted }
        val totalNet = items.sumOf { it.netPayable }

        val newRun = PayrollRun(
            id = "PAY-${System.currentTimeMillis()}",
            payrollNumber = "PAY-${SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())}",
            periodStart = periodStart,
            periodEnd = periodEnd,
            generatedAt = SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.getDefault()).format(Date()),
            totalGross = totalGross,
            totalDeductions = totalDeductions,
            totalNet = totalNet,
            items = items
        )

        _payrollRuns.value = listOf(newRun) + _payrollRuns.value
        logAudit("GENERATE_PAYROLL", "Generated payroll ${newRun.payrollNumber} totaling LKR ${totalNet.toInt()}")
    }

    // Generate Factory Invoice
    fun generateInvoice(factoryId: String, periodStart: String, periodEnd: String) {
        val factory = _factories.value.find { it.id == factoryId } ?: return
        val attRecords = _attendance.value.filter {
            it.factoryId == factoryId && it.date in periodStart..periodEnd &&
            (it.status == AttendanceStatus.PRESENT || it.status == AttendanceStatus.HALF_DAY)
        }

        val lineItems = attRecords.map { att ->
            val rate = when (factory.billingMethod) {
                BillingRateMethod.SAME_RATE_FOR_ALL -> factory.sameRate
                BillingRateMethod.SEPARATE_MALE_FEMALE_RATES -> {
                    if (att.employeeGender == Gender.MALE) factory.maleRate else factory.femaleRate
                }
            }
            val dayBillingTotal = att.payableUnits * rate
            val otHours = if (att.submissionStatus == SubmissionStatus.APPROVED) att.otHours else 0.0
            val otBillingTotal = otHours * factory.factoryOvertimeRateHourly
            val lineTotal = dayBillingTotal + otBillingTotal

            InvoiceLineItem(
                id = "li-${att.id}",
                employeeName = att.employeeName,
                employeeGender = att.employeeGender,
                date = att.date,
                billableDays = att.payableUnits,
                dayBillingTotal = dayBillingTotal,
                approvedOtHours = otHours,
                otBillingTotal = otBillingTotal,
                lineTotal = lineTotal
            )
        }

        val total = lineItems.sumOf { it.lineTotal }
        val now = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        val dueCal = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, 14) }
        val dueDate = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(dueCal.time)

        val newInvoice = FactoryInvoice(
            id = "INV-${System.currentTimeMillis()}",
            invoiceNumber = "INV-2026-${String.format(Locale.getDefault(), "%03d", _invoices.value.size + 1)}",
            factoryId = factory.id,
            factoryName = factory.name,
            invoiceDate = now,
            dueDate = dueDate,
            periodStart = periodStart,
            periodEnd = periodEnd,
            subtotal = total,
            totalAmount = total,
            amountReceived = 0.0,
            outstandingBalance = total,
            status = "issued",
            lineItems = lineItems
        )

        _invoices.value = listOf(newInvoice) + _invoices.value
        logAudit("GENERATE_INVOICE", "Generated invoice ${newInvoice.invoiceNumber} for ${factory.name} (LKR ${total.toInt()})")
    }

    // Record Factory Receipt
    fun recordReceipt(receipt: FactoryReceipt) {
        val currentReceipts = _receipts.value.toMutableList()
        currentReceipts.add(0, receipt)
        _receipts.value = currentReceipts

        // Update invoices if allocations provided
        val currentInvoices = _invoices.value.toMutableList()
        receipt.allocations.forEach { alloc ->
            val invIdx = currentInvoices.indexOfFirst { it.id == alloc.invoiceId }
            if (invIdx >= 0) {
                val inv = currentInvoices[invIdx]
                val newRcv = inv.amountReceived + alloc.amountAllocated
                val newBal = (inv.totalAmount - newRcv).coerceAtLeast(0.0)
                val newStatus = if (newBal <= 0.0) "paid" else "partially_paid"
                currentInvoices[invIdx] = inv.copy(
                    amountReceived = newRcv,
                    outstandingBalance = newBal,
                    status = newStatus
                )
            }
        }
        _invoices.value = currentInvoices
        logAudit("RECORD_RECEIPT", "Recorded payment receipt ${receipt.receiptNumber} of LKR ${receipt.amount.toInt()} from ${receipt.factoryName}")
    }
}
