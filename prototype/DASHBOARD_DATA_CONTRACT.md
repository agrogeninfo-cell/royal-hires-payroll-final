# Royal Pay Dashboard — Read-only Data Contract (Draft)

## Status
Draft for review. This document does not authorize live integration, production writes, schema changes, or a switch away from existing sync.

## Principles
- Read existing records through authorized application services.
- Reuse existing types and calculation services; do not duplicate payroll formulas in UI components.
- Never expose Supabase service-role or Google service-account credentials in browser code.
- Enforce existing role, active-user, company, and assigned-factory permissions at the data-access boundary.
- Do not expose employee NIC, address, phone, emergency contact, or other personal data in aggregate responses.
- Distinguish loading, empty, error, stale/offline, and permission-denied states.
- First phase is read-only. KPI cards and charts must not trigger mutations or financial actions.
- Use synthetic fixtures only; never copy production data into tests.

## Proposed view model
Amounts are LKR. Dates use the app's existing business-date convention. These are proposed UI view models, not new database tables.

### DashboardSummary
- periodStart: string (YYYY-MM-DD)
- periodEnd: string (YYYY-MM-DD)
- activeEmployeeCount: number
- attendancePresentCount: number
- attendanceAbsentCount: number
- attendanceHalfDayCount: number
- pendingOvertimeCount: number
- payrollGrossTotal?: number — only from existing payroll snapshots/runs
- payrollNetTotal?: number — only from existing payroll snapshots/runs
- unpaidEmployeeBalanceTotal?: number — use existing payment/balance fields
- openInvoiceBalanceTotal?: number — use existing invoice and receipt allocation records
- lastSyncAt?: string
- syncState: synced | pending | offline | error

### FactorySummary
- factoryId: string
- factoryName: string
- activeEmployeeCount: number
- attendanceCount: number
- pendingOvertimeCount: number
- payrollNetTotal?: number
- invoiceOutstandingTotal?: number

### TrendPoint
- date: string
- label: string
- value: number
- metric: attendance | payroll_gross | payroll_net | invoice

Optional financial totals must remain absent when source data is unavailable. Do not substitute a fabricated zero. Zero is valid only after successful loading confirms the actual total is zero.

## Source mapping
- Employee counts: existing Employee records and status.
- Attendance: existing AttendanceRecord status and payableUnits semantics.
- Overtime: existing submission/approval state; only approved OT contributes to payroll under the existing PayrollService.
- Payroll figures: existing PayrollRun / PayrollItem snapshots and existing service logic. Never recalculate historical runs using current rates.
- Employee balances: existing EmployeePayment and PayrollItem payment/balance fields.
- Invoice balances: existing FactoryInvoice, FactoryReceipt, ReceiptAllocation snapshots and existing allocation logic.
- Factory summaries: filter by the signed-in user's existing factory permissions before aggregation.
- Sync state: use existing sync status/metadata where available; do not create a competing source of truth.

## Authorization expectations
- Admin: company/factory summaries only as allowed by current policy.
- Office staff: follow the existing app authorization policy.
- Supervisor: only assigned factories and collections currently permitted by supervisor policy.
- Never trust a factory ID supplied by a client without validating the signed-in user's assignment.
- If authorization cannot be verified, fail closed; do not fall back to all-factory data.

## Error and display semantics
- loading: skeletons
- empty: explain no records exist for selected period
- offline/stale: show last successful sync time when known and label data as local/stale
- error: do not silently show zero totals
- permission denied: do not reveal restricted record existence
- LKR formatting is presentation-only and must not change numeric values

## Phase 1 non-goals
- No Google Sheets cutover.
- No schema migration.
- No new payroll or invoice formulas.
- No dashboard writes, approvals, payments, receipt allocations, or deletions.
- No new production API endpoint until existing authentication and authorization have been reviewed.

## Acceptance criteria
1. Payroll formulas and historical snapshots remain unchanged.
2. UI can render from synthetic data in tests.
3. Supervisor cannot read unassigned factory data.
4. Missing records do not become invented zero-valued financial totals.
5. Offline and sync-error states are visible.
6. No secrets or personal identifiers are embedded in client code or fixtures.
7. Feature remains isolated behind a route/flag until separately reviewed and approved.
