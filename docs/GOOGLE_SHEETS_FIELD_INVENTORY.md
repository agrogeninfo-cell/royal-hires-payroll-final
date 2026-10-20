# Royal Pay Google Sheets Field Inventory (Draft)

Source reviewed: `src/types/index.ts` on the current main commit. This is a mapping inventory only; it does not create tabs, write spreadsheet data, or change app behavior.

## Rules for all tabs
- Preserve existing record IDs exactly. Do not generate replacement IDs during migration.
- Keep monetary values numeric in LKR; dates in ISO `YYYY-MM-DD` and timestamps in ISO 8601 where the app uses them.
- Never treat spreadsheet row numbers as record IDs.
- Add integration metadata (`companyId`, `revision`, `updatedAt`, `lastMutationId`) only in a separately reviewed API/storage envelope; do not silently add fields to existing payroll domain objects.
- Any JSON-encoded nested object must be validated against the exact current TypeScript type before acceptance.
- Spreadsheet access must be private. Mobile clients must not hold service-account credentials.

## Proposed tab-to-type mapping

| Proposed tab | Existing source type / store | Key relationships and caution |
|---|---|---|
| Factories | `Factory` / `factories` | `id` is the stable key; shifts and supervisorIds are arrays; rates and billing rules must be preserved exactly. |
| Employees | `Employee` / `employees` | `id`; `currentFactoryId` references Factory; `boardingLocationId` optional; contains sensitive NIC and contact information. Restrict access. |
| Attendance | `AttendanceRecord` / `attendance` | `id`; references employee and factory; preserve payableUnits, meal/boarding flags, approval status, OT hours/minutes and sync/conflict fields. |
| Overtime | `OvertimeSubmission` / `overtime` | `id`; references attendance, employee and factory; preserve both employee-pay and factory-billing rate snapshots and approval state. |
| PayrollRuns | `PayrollRun` with nested `PayrollItem[]` / `payroll_runs` | `id` and payrollNumber; financial snapshots and totals are historical records. Do not recalculate on import. Preserve each item field. |
| EmployeePayments | `EmployeePayment` / `employee_payments` | `id`; employee reference; optional payrollRunId/payrollItemId; payment amount/date/method/reference. Must be idempotent and auditable. |
| Invoices | `FactoryInvoice` with nested `InvoiceLineItem[]` / `invoices` | `id` and invoiceNumber; preserve snapshots, adjustments, totalAmount, amountReceived, outstandingBalance and status exactly. |
| Receipts | `FactoryReceipt` with nested `ReceiptAllocation[]` / `receipts` | `id` and receiptNumber; allocations reference invoices. Do not apply allocations twice. |
| BoardingLocations | `BoardingLocation` / `boarding_locations` | `id`; dailyRate is numeric LKR; restrict contact details as needed. |
| BillingRateHistory | `FactoryBillingRateHistory` / `billing_rate_history` | `id`; factory reference; preserve effective dates and active state for historical billing. |
| AuditLogs | `AuditLog` / `audit_logs` | `id`; append-oriented history; beforeValues/afterValues can be nested JSON. Avoid exposing unnecessary personal data. |
| SyncMetadata | Integration envelope only | Proposed fields: `recordId`, `entityType`, `companyId`, `factoryId`, `revision`, `updatedAt`, `lastMutationId`, `lastSyncedAt`, `syncState`. Requires API design and security review; not a current domain type. |

## Important fields that must not be lost

### Factory
`id, code, name, address, contactPerson, contactPhone, active, invoicePeriod, shifts, overtimeEnabled, employeeOvertimeRateHourly, factoryOvertimeRateHourly, billingMethod, sameRate, maleRate, femaleRate, nightMaleRate, nightFemaleRate, billingEffectiveFrom, billingEffectiveTo, breakfastRate, lunchRate, dinnerRate, supervisorIds, specialBillingDates, createdAt, updatedAt, cloudSyncReady, cloudSyncConfirmed`.

### Employee
`id, fullName, nic, phone, address, gender, emergencyContact, startDate, status, designation, currentFactoryId, wageArrangement, wageRate, eligibleForMeals, eligibleForBoarding, boardingLocationId, notes, createdAt, updatedAt, cloudSyncReady`.

### Attendance
`id, employeeId, employeeName, employeeGender, factoryId, factoryName, date, shift, status, checkIn, checkOut, payableUnits, otHours, otMinutes, totalOtHours, lateHours, hadBreakfast, hadLunch, hadDinner, hadBoarding, notes, recordedBy, supervisorName, submissionStatus, billable, approvedBy, approvedAt, isOfflineCreated, syncStatus, conflictReason, createdAt, updatedAt, cloudSyncReady`.

### Payroll and invoice financial snapshots
- PayrollRun stores period dates, status, totals, approvals and nested PayrollItems. Preserve snapshots including wage/OT rates, days worked, all meal and boarding deductions, advances, other deductions, netPayable, amountPaid, remainingBalance, and paymentStatus.
- FactoryInvoice stores lineItems, snapshot billing rates, billable days, OT billing totals, subtotal, adjustments, totalAmount, amountReceived, outstandingBalance and status.
- FactoryReceipt stores receipt amount, unallocated amount and nested allocations.
- Do not derive or overwrite historic totals during data import. Any reconciliation discrepancy must be reported for human review.

## Scope and access requirements
The current `cloudSyncServiceV3.ts` explicitly includes only the local factories named Empire Teas and Millennium Teas in operational synchronization. This must not be broadened implicitly. Before production implementation, the owner must confirm intended factory scope, and backend authorization must enforce company and assigned-factory access independent of client-side filtering.

## Verification still required
1. Inspect the actual spreadsheet tabs and headers using an authorized Google connection. The current integration tools have not read the owner's spreadsheet.
2. Compare this inventory with every consumer in payroll, billing, invoice, receipt allocation, reports, and backup import/export code.
3. Define server-side schema validation, locking/serialization, revision/conflict semantics, retry idempotency, rate limits, audit trail and backup/restore procedures.
4. Create a separate test spreadsheet or test-only tabs and use synthetic records for all initial write tests.
5. Keep Supabase operational sync active until the owner approves a successful reconciliation and staged cutover.

## Status
Draft field inventory only. No Google API integration has been implemented yet. No spreadsheet values, local records, Supabase records, schema, or payroll logic were modified.
