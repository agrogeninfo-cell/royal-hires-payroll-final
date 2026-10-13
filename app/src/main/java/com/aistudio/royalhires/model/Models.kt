package com.aistudio.royalhires.model

enum class UserRole(val label: String) {
    ADMIN("Director / Admin"),
    OFFICE_STAFF("Office Staff"),
    SUPERVISOR("Field Supervisor")
}

data class User(
    val id: String,
    val name: String,
    val email: String,
    val role: UserRole,
    val phone: String = "",
    val assignedFactoryIds: List<String> = emptyList(),
    val active: Boolean = true
)

enum class BillingRateMethod(val label: String) {
    SAME_RATE_FOR_ALL("Standard Rate (All Helpers)"),
    SEPARATE_MALE_FEMALE_RATES("Separate Male & Female Rates")
}

data class FactoryShift(
    val id: String,
    val name: String,
    val startTime: String,
    val endTime: String,
    val standardHours: Int = 8
)

data class Factory(
    val id: String,
    val code: String,
    val name: String,
    val address: String,
    val contactPerson: String,
    val contactPhone: String,
    val active: Boolean = true,
    val invoicePeriod: String = "weekly", // weekly, biweekly, monthly
    val shifts: List<FactoryShift> = emptyList(),
    val overtimeEnabled: Boolean = true,
    val employeeOvertimeRateHourly: Double = 350.0, // LKR/hr paid to worker
    val factoryOvertimeRateHourly: Double = 500.0,  // LKR/hr billed to client factory
    val billingMethod: BillingRateMethod = BillingRateMethod.SAME_RATE_FOR_ALL,
    val sameRate: Double = 3000.0, // Standard daily helper rate LKR
    val maleRate: Double = 3200.0,
    val femaleRate: Double = 2900.0,
    val billingEffectiveFrom: String = "2026-01-01",
    val breakfastRate: Double = 150.0,
    val lunchRate: Double = 250.0,
    val dinnerRate: Double = 200.0,
    val supervisorIds: List<String> = emptyList()
)

enum class WageArrangement(val label: String) {
    DAILY("Daily Wage"),
    WEEKLY("Weekly Wage"),
    MONTHLY("Monthly Wage")
}

enum class Gender(val label: String) {
    MALE("Male"),
    FEMALE("Female")
}

data class Employee(
    val id: String,
    val fullName: String,
    val nic: String,
    val phone: String,
    val address: String,
    val gender: Gender,
    val status: String = "active", // active, inactive, resigned
    val designation: String = "Helper", // Fixed rule: Always Helper
    val currentFactoryId: String,
    val wageArrangement: WageArrangement = WageArrangement.DAILY,
    val wageRate: Double = 2200.0, // Daily/Weekly/Monthly wage paid to employee
    val eligibleForMeals: Boolean = true,
    val eligibleForBoarding: Boolean = true,
    val boardingLocationId: String? = null,
    val emergencyContact: String = ""
)

data class BoardingLocation(
    val id: String,
    val name: String,
    val address: String,
    val contactPhone: String,
    val dailyRate: Double = 350.0,
    val active: Boolean = true
)

enum class AttendanceStatus(val label: String) {
    PRESENT("Present"),
    ABSENT("Absent"),
    HALF_DAY("Half Day"),
    LEAVE("Approved Leave")
}

enum class SubmissionStatus(val label: String) {
    SUBMITTED("Pending Approval"),
    APPROVED("Approved"),
    REJECTED("Rejected")
}

data class AttendanceRecord(
    val id: String,
    val employeeId: String,
    val employeeName: String,
    val employeeGender: Gender,
    val factoryId: String,
    val factoryName: String,
    val date: String, // YYYY-MM-DD
    val shift: String = "Day Shift",
    val status: AttendanceStatus = AttendanceStatus.PRESENT,
    val payableUnits: Double = 1.0,
    val otHours: Double = 0.0,
    val hadBreakfast: Boolean = false,
    val hadLunch: Boolean = false,
    val hadDinner: Boolean = false,
    val hadBoarding: Boolean = false,
    val notes: String = "",
    val supervisorName: String = "Chandana F.",
    val submissionStatus: SubmissionStatus = SubmissionStatus.SUBMITTED
)

data class PayrollItem(
    val id: String,
    val employeeId: String,
    val employeeName: String,
    val daysWorked: Double,
    val normalWage: Double,
    val approvedOtHours: Double,
    val otWage: Double,
    val grossEarnings: Double,
    val mealDeductions: Double,
    val boardingDeductions: Double,
    val advancesDeducted: Double,
    val netPayable: Double
)

data class PayrollRun(
    val id: String,
    val payrollNumber: String,
    val periodStart: String,
    val periodEnd: String,
    val generatedAt: String,
    val status: String = "approved",
    val totalGross: Double,
    val totalDeductions: Double,
    val totalNet: Double,
    val items: List<PayrollItem>
)

data class InvoiceLineItem(
    val id: String,
    val employeeName: String,
    val employeeGender: Gender,
    val date: String,
    val billableDays: Double,
    val dayBillingTotal: Double,
    val approvedOtHours: Double,
    val otBillingTotal: Double,
    val lineTotal: Double
)

data class FactoryInvoice(
    val id: String,
    val invoiceNumber: String,
    val factoryId: String,
    val factoryName: String,
    val invoiceDate: String,
    val dueDate: String,
    val periodStart: String,
    val periodEnd: String,
    val subtotal: Double,
    val totalAmount: Double,
    val amountReceived: Double = 0.0,
    val outstandingBalance: Double,
    val status: String = "issued", // draft, issued, partially_paid, paid
    val lineItems: List<InvoiceLineItem> = emptyList()
)

data class ReceiptAllocation(
    val id: String,
    val invoiceId: String,
    val invoiceNumber: String,
    val amountAllocated: Double
)

data class FactoryReceipt(
    val id: String,
    val receiptNumber: String,
    val factoryId: String,
    val factoryName: String,
    val receiptDate: String,
    val amount: Double,
    val paymentMethod: String = "Bank Transfer", // Bank Transfer, Cheque, Cash
    val referenceNumber: String,
    val unallocatedAmount: Double = 0.0,
    val allocations: List<ReceiptAllocation> = emptyList()
)

data class AuditLog(
    val id: String,
    val timestamp: String,
    val actor: String,
    val role: String,
    val action: String,
    val details: String
)

enum class Screen(val title: String) {
    DASHBOARD("Dashboard"),
    ATTENDANCE("Attendance"),
    OVERTIME("OT Approval"),
    FACTORIES("Factories"),
    EMPLOYEES("Employees"),
    BOARDING("Boarding"),
    PAYROLL("Payroll"),
    INVOICES("Invoices"),
    RECEIPTS("Receipts"),
    REPORTS("Reports"),
    AUDIT("Audit Trail"),
    PROFILE("Agency Profile")
}
