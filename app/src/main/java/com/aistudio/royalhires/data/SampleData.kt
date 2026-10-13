package com.aistudio.royalhires.data

import com.aistudio.royalhires.model.*

object SampleData {
    val users = listOf(
        User(
            id = "usr-admin",
            name = "Pradeep Silva",
            email = "admin@royalhires.lk",
            role = UserRole.ADMIN,
            phone = "+94 77 123 4567"
        ),
        User(
            id = "usr-office",
            name = "Nimesha Perera",
            email = "office@royalhires.lk",
            role = UserRole.OFFICE_STAFF,
            phone = "+94 71 987 6543"
        ),
        User(
            id = "usr-sup-kelani",
            name = "Chandana Fernando",
            email = "sup.kelani@royalhires.lk",
            role = UserRole.SUPERVISOR,
            phone = "+94 76 555 1234",
            assignedFactoryIds = listOf("fac-kelani")
        ),
        User(
            id = "usr-sup-biyagama",
            name = "Mahinda Bandara",
            email = "sup.biyagama@royalhires.lk",
            role = UserRole.SUPERVISOR,
            phone = "+94 72 444 9876",
            assignedFactoryIds = listOf("fac-biyagama")
        )
    )

    val boardingLocations = listOf(
        BoardingLocation(
            id = "board-01",
            name = "Kelaniya Agency Quarters",
            address = "No. 45, Station Road, Kelaniya",
            contactPhone = "+94 11 291 0001",
            dailyRate = 350.0
        ),
        BoardingLocation(
            id = "board-02",
            name = "Biyagama FTZ Quarters",
            address = "Zone 1 Road, Biyagama Export Processing Zone",
            contactPhone = "+94 11 248 8899",
            dailyRate = 400.0
        )
    )

    val factories = listOf(
        Factory(
            id = "fac-kelani",
            code = "FAC-KELANI",
            name = "Kelani Textiles PLC",
            address = "Industrial Estate, Kelaniya",
            contactPerson = "Mr. Rohan Gunasekara (Factory Manager)",
            contactPhone = "+94 11 291 5566",
            billingMethod = BillingRateMethod.SAME_RATE_FOR_ALL,
            sameRate = 3000.0,
            employeeOvertimeRateHourly = 350.0,
            factoryOvertimeRateHourly = 500.0,
            breakfastRate = 150.0,
            lunchRate = 250.0,
            dinnerRate = 200.0,
            shifts = listOf(
                FactoryShift("sh-1", "Morning Shift", "07:00", "15:30", 8),
                FactoryShift("sh-2", "Night Shift", "19:00", "03:30", 8)
            )
        ),
        Factory(
            id = "fac-biyagama",
            code = "FAC-BIYAGAMA",
            name = "Biyagama Packaging Ltd",
            address = "Block B, Biyagama EPZ, Malwana",
            contactPerson = "Ms. Nelum Jayawardena (HR Lead)",
            contactPhone = "+94 11 246 7711",
            billingMethod = BillingRateMethod.SEPARATE_MALE_FEMALE_RATES,
            maleRate = 3200.0,
            femaleRate = 2900.0,
            employeeOvertimeRateHourly = 400.0,
            factoryOvertimeRateHourly = 550.0,
            breakfastRate = 140.0,
            lunchRate = 240.0,
            dinnerRate = 220.0,
            shifts = listOf(
                FactoryShift("sh-3", "General Shift", "08:00", "17:00", 8)
            )
        ),
        Factory(
            id = "fac-katunayake",
            code = "FAC-KATUNAYAKE",
            name = "Katunayake Garments Exports",
            address = "Phase II, Katunayake FTZ",
            contactPerson = "Mr. Sunil Weerasinghe",
            contactPhone = "+94 31 223 9012",
            billingMethod = BillingRateMethod.SAME_RATE_FOR_ALL,
            sameRate = 3400.0,
            employeeOvertimeRateHourly = 380.0,
            factoryOvertimeRateHourly = 520.0,
            breakfastRate = 160.0,
            lunchRate = 260.0,
            dinnerRate = 210.0,
            shifts = listOf(
                FactoryShift("sh-4", "Day Shift", "08:00", "17:00", 8)
            )
        )
    )

    val employees = listOf(
        Employee(
            id = "EMP-101",
            fullName = "Kamal Wickramasinghe",
            nic = "199423401234",
            phone = "+94 77 234 5678",
            address = "No. 12, Temple Road, Kiribathgoda",
            gender = Gender.MALE,
            currentFactoryId = "fac-kelani",
            wageRate = 2200.0,
            eligibleForMeals = true,
            eligibleForBoarding = true,
            boardingLocationId = "board-01"
        ),
        Employee(
            id = "EMP-102",
            fullName = "Anoma Kumari",
            nic = "199656708901",
            phone = "+94 71 345 6789",
            address = "45/A, Colombo Road, Kelaniya",
            gender = Gender.FEMALE,
            currentFactoryId = "fac-kelani",
            wageRate = 2100.0,
            eligibleForMeals = true,
            eligibleForBoarding = false
        ),
        Employee(
            id = "EMP-103",
            fullName = "Sunil Shantha",
            nic = "881234567V",
            phone = "+94 78 456 7890",
            address = "Kurunegala Road, Giriulla",
            gender = Gender.MALE,
            currentFactoryId = "fac-kelani",
            wageRate = 2300.0,
            eligibleForMeals = true,
            eligibleForBoarding = true,
            boardingLocationId = "board-01"
        ),
        Employee(
            id = "EMP-104",
            fullName = "Chathurika Damayanthi",
            nic = "925678901V",
            phone = "+94 75 567 8901",
            address = "Biyagama South, Malwana",
            gender = Gender.FEMALE,
            currentFactoryId = "fac-biyagama",
            wageRate = 2150.0,
            eligibleForMeals = true,
            eligibleForBoarding = true,
            boardingLocationId = "board-02"
        ),
        Employee(
            id = "EMP-105",
            fullName = "Nuwan Jayasuriya",
            nic = "199812304567",
            phone = "+94 72 678 9012",
            address = "Station Lane, Ragama",
            gender = Gender.MALE,
            currentFactoryId = "fac-biyagama",
            wageRate = 2250.0,
            eligibleForMeals = true,
            eligibleForBoarding = false
        ),
        Employee(
            id = "EMP-106",
            fullName = "Kavindi Hansika",
            nic = "200056701234",
            phone = "+94 77 789 0123",
            address = "Village Road, Biyagama",
            gender = Gender.FEMALE,
            currentFactoryId = "fac-biyagama",
            wageRate = 2150.0,
            eligibleForMeals = true,
            eligibleForBoarding = true,
            boardingLocationId = "board-02"
        ),
        Employee(
            id = "EMP-107",
            fullName = "Bandula Senanayake",
            nic = "823456789V",
            phone = "+94 71 890 1234",
            address = "Main Street, Minuwangoda",
            gender = Gender.MALE,
            currentFactoryId = "fac-katunayake",
            wageRate = 2400.0,
            eligibleForMeals = true,
            eligibleForBoarding = false
        ),
        Employee(
            id = "EMP-108",
            fullName = "Priyantha Jayalath",
            nic = "901234567V",
            phone = "+94 76 901 2345",
            address = "Negombo Road, Katunayake",
            gender = Gender.MALE,
            currentFactoryId = "fac-katunayake",
            wageRate = 2350.0,
            eligibleForMeals = true,
            eligibleForBoarding = false
        ),
        Employee(
            id = "EMP-109",
            fullName = "Nirosha Dilrukshi",
            nic = "199578901234",
            phone = "+94 78 012 3456",
            address = "Seeduwa West, Seeduwa",
            gender = Gender.FEMALE,
            currentFactoryId = "fac-katunayake",
            wageRate = 2200.0,
            eligibleForMeals = true,
            eligibleForBoarding = false
        ),
        Employee(
            id = "EMP-110",
            fullName = "Roshan Sandaruwan",
            nic = "199923405678",
            phone = "+94 70 123 4567",
            address = "Horana Road, Panadura",
            gender = Gender.MALE,
            currentFactoryId = "fac-kelani",
            wageRate = 2200.0,
            eligibleForMeals = true,
            eligibleForBoarding = true,
            boardingLocationId = "board-01"
        )
    )

    val attendance = listOf(
        AttendanceRecord(
            id = "att-001",
            employeeId = "EMP-101",
            employeeName = "Kamal Wickramasinghe",
            employeeGender = Gender.MALE,
            factoryId = "fac-kelani",
            factoryName = "Kelani Textiles PLC",
            date = "2026-10-13",
            status = AttendanceStatus.PRESENT,
            payableUnits = 1.0,
            otHours = 2.0,
            hadBreakfast = true,
            hadLunch = true,
            hadDinner = false,
            hadBoarding = true,
            submissionStatus = SubmissionStatus.SUBMITTED
        ),
        AttendanceRecord(
            id = "att-002",
            employeeId = "EMP-102",
            employeeName = "Anoma Kumari",
            employeeGender = Gender.FEMALE,
            factoryId = "fac-kelani",
            factoryName = "Kelani Textiles PLC",
            date = "2026-10-13",
            status = AttendanceStatus.PRESENT,
            payableUnits = 1.0,
            otHours = 1.5,
            hadBreakfast = false,
            hadLunch = true,
            hadDinner = false,
            hadBoarding = false,
            submissionStatus = SubmissionStatus.SUBMITTED
        ),
        AttendanceRecord(
            id = "att-003",
            employeeId = "EMP-103",
            employeeName = "Sunil Shantha",
            employeeGender = Gender.MALE,
            factoryId = "fac-kelani",
            factoryName = "Kelani Textiles PLC",
            date = "2026-10-13",
            status = AttendanceStatus.PRESENT,
            payableUnits = 1.0,
            otHours = 3.0,
            hadBreakfast = true,
            hadLunch = true,
            hadDinner = true,
            hadBoarding = true,
            submissionStatus = SubmissionStatus.APPROVED
        ),
        AttendanceRecord(
            id = "att-004",
            employeeId = "EMP-104",
            employeeName = "Chathurika Damayanthi",
            employeeGender = Gender.FEMALE,
            factoryId = "fac-biyagama",
            factoryName = "Biyagama Packaging Ltd",
            date = "2026-10-13",
            status = AttendanceStatus.PRESENT,
            payableUnits = 1.0,
            otHours = 2.0,
            hadBreakfast = true,
            hadLunch = true,
            hadDinner = false,
            hadBoarding = true,
            submissionStatus = SubmissionStatus.SUBMITTED
        ),
        AttendanceRecord(
            id = "att-005",
            employeeId = "EMP-105",
            employeeName = "Nuwan Jayasuriya",
            employeeGender = Gender.MALE,
            factoryId = "fac-biyagama",
            factoryName = "Biyagama Packaging Ltd",
            date = "2026-10-13",
            status = AttendanceStatus.HALF_DAY,
            payableUnits = 0.5,
            otHours = 0.0,
            hadBreakfast = true,
            hadLunch = false,
            hadDinner = false,
            hadBoarding = false,
            submissionStatus = SubmissionStatus.APPROVED
        ),
        AttendanceRecord(
            id = "att-006",
            employeeId = "EMP-106",
            employeeName = "Kavindi Hansika",
            employeeGender = Gender.FEMALE,
            factoryId = "fac-biyagama",
            factoryName = "Biyagama Packaging Ltd",
            date = "2026-10-13",
            status = AttendanceStatus.ABSENT,
            payableUnits = 0.0,
            otHours = 0.0,
            hadBreakfast = false,
            hadLunch = false,
            hadDinner = false,
            hadBoarding = true,
            submissionStatus = SubmissionStatus.APPROVED
        ),
        AttendanceRecord(
            id = "att-007",
            employeeId = "EMP-107",
            employeeName = "Bandula Senanayake",
            employeeGender = Gender.MALE,
            factoryId = "fac-katunayake",
            factoryName = "Katunayake Garments Exports",
            date = "2026-10-13",
            status = AttendanceStatus.PRESENT,
            payableUnits = 1.0,
            otHours = 2.5,
            hadBreakfast = true,
            hadLunch = true,
            hadDinner = false,
            hadBoarding = false,
            submissionStatus = SubmissionStatus.SUBMITTED
        ),
        AttendanceRecord(
            id = "att-008",
            employeeId = "EMP-108",
            employeeName = "Priyantha Jayalath",
            employeeGender = Gender.MALE,
            factoryId = "fac-katunayake",
            factoryName = "Katunayake Garments Exports",
            date = "2026-10-13",
            status = AttendanceStatus.PRESENT,
            payableUnits = 1.0,
            otHours = 2.0,
            hadBreakfast = false,
            hadLunch = true,
            hadDinner = false,
            hadBoarding = false,
            submissionStatus = SubmissionStatus.APPROVED
        )
    )

    val payrollRuns = listOf(
        PayrollRun(
            id = "PAY-2026-10-01",
            payrollNumber = "PAY-2026-10-01",
            periodStart = "2026-10-01",
            periodEnd = "2026-10-07",
            generatedAt = "2026-10-08 10:00",
            totalGross = 142500.0,
            totalDeductions = 24800.0,
            totalNet = 117700.0,
            items = listOf(
                PayrollItem(
                    id = "pi-1",
                    employeeId = "EMP-101",
                    employeeName = "Kamal Wickramasinghe",
                    daysWorked = 6.0,
                    normalWage = 13200.0,
                    approvedOtHours = 10.0,
                    otWage = 3500.0,
                    grossEarnings = 16700.0,
                    mealDeductions = 2400.0,
                    boardingDeductions = 2100.0,
                    advancesDeducted = 2000.0,
                    netPayable = 10200.0
                ),
                PayrollItem(
                    id = "pi-2",
                    employeeId = "EMP-102",
                    employeeName = "Anoma Kumari",
                    daysWorked = 6.0,
                    normalWage = 12600.0,
                    approvedOtHours = 8.0,
                    otWage = 2800.0,
                    grossEarnings = 15400.0,
                    mealDeductions = 1500.0,
                    boardingDeductions = 0.0,
                    advancesDeducted = 1000.0,
                    netPayable = 12900.0
                ),
                PayrollItem(
                    id = "pi-3",
                    employeeId = "EMP-103",
                    employeeName = "Sunil Shantha",
                    daysWorked = 6.0,
                    normalWage = 13800.0,
                    approvedOtHours = 12.0,
                    otWage = 4200.0,
                    grossEarnings = 18000.0,
                    mealDeductions = 3000.0,
                    boardingDeductions = 2100.0,
                    advancesDeducted = 0.0,
                    netPayable = 12900.0
                )
            )
        )
    )

    val invoices = listOf(
        FactoryInvoice(
            id = "INV-2026-001",
            invoiceNumber = "INV-2026-001",
            factoryId = "fac-kelani",
            factoryName = "Kelani Textiles PLC",
            invoiceDate = "2026-10-08",
            dueDate = "2026-10-22",
            periodStart = "2026-10-01",
            periodEnd = "2026-10-07",
            subtotal = 78500.0,
            totalAmount = 78500.0,
            amountReceived = 50000.0,
            outstandingBalance = 28500.0,
            status = "partially_paid",
            lineItems = listOf(
                InvoiceLineItem("li-1", "Kamal Wickramasinghe", Gender.MALE, "2026-10-01", 1.0, 3000.0, 2.0, 1000.0, 4000.0),
                InvoiceLineItem("li-2", "Anoma Kumari", Gender.FEMALE, "2026-10-01", 1.0, 3000.0, 1.5, 750.0, 3750.0),
                InvoiceLineItem("li-3", "Sunil Shantha", Gender.MALE, "2026-10-01", 1.0, 3000.0, 3.0, 1500.0, 4500.0)
            )
        ),
        FactoryInvoice(
            id = "INV-2026-002",
            invoiceNumber = "INV-2026-002",
            factoryId = "fac-biyagama",
            factoryName = "Biyagama Packaging Ltd",
            invoiceDate = "2026-10-08",
            dueDate = "2026-10-22",
            periodStart = "2026-10-01",
            periodEnd = "2026-10-07",
            subtotal = 64800.0,
            totalAmount = 64800.0,
            amountReceived = 64800.0,
            outstandingBalance = 0.0,
            status = "paid"
        ),
        FactoryInvoice(
            id = "INV-2026-003",
            invoiceNumber = "INV-2026-003",
            factoryId = "fac-katunayake",
            factoryName = "Katunayake Garments Exports",
            invoiceDate = "2026-10-08",
            dueDate = "2026-10-22",
            periodStart = "2026-10-01",
            periodEnd = "2026-10-07",
            subtotal = 81200.0,
            totalAmount = 81200.0,
            amountReceived = 0.0,
            outstandingBalance = 81200.0,
            status = "issued"
        )
    )

    val receipts = listOf(
        FactoryReceipt(
            id = "RCT-2026-001",
            receiptNumber = "RCT-2026-001",
            factoryId = "fac-biyagama",
            factoryName = "Biyagama Packaging Ltd",
            receiptDate = "2026-10-10",
            amount = 64800.0,
            paymentMethod = "Bank Transfer",
            referenceNumber = "BOC-TX-998231",
            unallocatedAmount = 0.0,
            allocations = listOf(
                ReceiptAllocation("ra-1", "INV-2026-002", "INV-2026-002", 64800.0)
            )
        ),
        FactoryReceipt(
            id = "RCT-2026-002",
            receiptNumber = "RCT-2026-002",
            factoryId = "fac-kelani",
            factoryName = "Kelani Textiles PLC",
            receiptDate = "2026-10-11",
            amount = 50000.0,
            paymentMethod = "Cheque",
            referenceNumber = "CHQ-COM-45521",
            unallocatedAmount = 0.0,
            allocations = listOf(
                ReceiptAllocation("ra-2", "INV-2026-001", "INV-2026-001", 50000.0)
            )
        )
    )

    val auditLogs = listOf(
        AuditLog("aud-1", "2026-10-13 07:30", "Chandana Fernando", "Supervisor", "SUBMIT_ATTENDANCE", "Submitted 4 helper attendance logs for Kelani Textiles."),
        AuditLog("aud-2", "2026-10-13 08:15", "Mahinda Bandara", "Supervisor", "SUBMIT_ATTENDANCE", "Submitted 3 helper attendance logs for Biyagama Packaging."),
        AuditLog("aud-3", "2026-10-12 16:45", "Pradeep Silva", "Admin", "APPROVE_OVERTIME", "Approved 12.5 total overtime hours across Kelani Textiles workforce."),
        AuditLog("aud-4", "2026-10-11 11:20", "Nimesha Perera", "Office Staff", "RECORD_RECEIPT", "Recorded payment receipt RCT-2026-002 of LKR 50,000 from Kelani Textiles.")
    )
}
