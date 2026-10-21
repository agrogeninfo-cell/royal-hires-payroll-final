# Royal Pay Dashboard — Synthetic Test Plan (Draft)

## Scope and safety
Use fake IDs, names, dates, and amounts only. Do not export or paste production employee/payroll data into test files. Do not modify production records, schema, payroll logic, cloud sync, or Google Sheets.

## Fixture set
Prepare deterministic synthetic fixtures for:
- Admin, office staff, and two supervisors assigned to different factories.
- Two fake factories with distinct billing settings.
- Active/inactive employees using daily, weekly, and monthly wage arrangements.
- Attendance: present, absent, leave, and half-day.
- OT submissions: submitted, approved, and rejected.
- Payroll run with frozen PayrollItem snapshots.
- Meal/boarding eligibility both enabled and disabled, with recorded/unrecorded usage.
- Partial employee payments and remaining balance.
- Invoice with multiple lines and partial receipt allocations.
- Sync states: synced, pending, offline, and error.
All identifiers and personal-like values must be clearly synthetic.

## Functional checks
1. Selected date range shows loading state before results.
2. Empty period shows an empty-state message, not fabricated data.
3. KPI totals match authorized fixture records exactly.
4. Payroll amounts come from existing service logic or saved snapshots; no duplicate formula in dashboard UI.
5. Only approved OT is included, consistent with the existing payroll service.
6. Meal deductions require meal eligibility and recorded usage.
7. Boarding deductions require eligibility, a boarding location, and recorded usage.
8. Historical payroll/invoice views use saved snapshots, not current rates.
9. Partial payments and receipt allocations use existing balance logic.
10. Date boundaries follow the existing app convention and are documented/tested.
11. LKR formatting does not mutate underlying values.
12. No records means empty state; successfully loaded true-zero totals may show zero.
13. Sync pending/offline/error states are distinct from current synced data.

## Authorization checks
1. Admin sees only records permitted by current company policy.
2. Office staff follows the existing app authorization policy.
3. Supervisor A cannot see Factory B counts, attendance, payroll, invoices, employees, or balances.
4. Client-side factory ID changes cannot bypass data-layer authorization.
5. Disabled/inactive users cannot access dashboard data.
6. Errors do not reveal restricted record names or counts.

## Regression checks before integration
- Existing payroll calculation tests pass unchanged.
- Existing invoice generation and receipt allocation tests pass unchanged.
- Existing payslip/PDF and Excel export paths remain unaffected.
- IndexedDB persistence and offline behavior remain unaffected.
- Existing Supabase sync and collection restrictions remain unchanged.
- Android build, lint, and tests pass in CI before review.

## Release gate
Do not enable live data, merge, deploy, switch sync providers, or change production behavior until the UI is approved, the data contract reviewed, regression tests pass, authorization checks demonstrated, and the user explicitly approves the release step.
