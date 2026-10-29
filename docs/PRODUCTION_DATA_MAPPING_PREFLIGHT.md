# Production Data Mapping — Read-only Preflight

## Purpose
Map the legacy Production schema to the newer Royal Hires app model without changing live data. This document is a preflight checklist; it is not an executable migration.

## Known schemas

### Legacy Production
- `employees`: 20 rows; UUID `id`, `labour_code`, `name`, `daily_rate`, `ot_rate`, `factory_id` (text), `factory`, contact fields, `gender`.
- `attendance`: 6 rows; UUID `id`, date, employee UUID, text factory ID, status, OT hours, late minutes.
- `settlements`: 0 rows; employee UUID, gross, net payable, days, OT hours.
- `meals`: 0 rows; employee UUID, meal date, breakfast/lunch/dinner counts.

### New app model (Dev)
- `companies`, `profiles`, `factories`, `user_factory_assignments`, `app_records`.
- `app_records` is keyed by (`company_id`, `collection_name`, `record_id`) and stores JSON payloads for `factory_configs`, `employees`, `attendance`, `overtime`, `payroll_runs`, `employee_payments`, `invoices`, `receipts`, `boarding_locations`, `billing_rate_history`, and `audit_logs`.
- The app expects approved, active profiles and company/factory scoped RLS.

## Deterministic mapping requirements
1. Confirm the Production company identity and authorized admin Auth user; never invent a UUID or attach the wrong user.
2. Map every legacy factory label/ID to a verified row in `factories`; preserve original labels in the payload and `legacy_id`.
3. Map legacy employees by their existing UUID as a stable `record_id` only after confirming the app's employee payload shape and local ID conventions. Preserve `labour_code`, rates, gender and contact data exactly.
4. Map attendance by existing UUID, retaining date, status, OT hours, late minutes and employee relationship.
5. Do not infer settlements as payroll runs or payments without checking the frontend's exact record shape. Current Production settlements table is empty.
6. Do not invent meals; current Production meals table is empty.
7. Do not copy Dev's 151 records into Production; those are Dev operational records and require explicit data ownership/reconciliation first.
8. Do not change legacy table RLS or remove permissive policies until a tested replacement access path is deployed and validated.

## Preflight SQL (read-only; run one statement at a time in the SQL editor)

```sql
select count(*) as employees_count from public.employees;
select count(*) as attendance_count from public.attendance;
select count(*) as settlements_count from public.settlements;
select count(*) as meals_count from public.meals;
select factory, factory_id, count(*) as employees
from public.employees
group by factory, factory_id
order by factory, factory_id;
select status, count(*) as attendance_rows
from public.attendance
group by status
order by status;
```

## Required validation before any write
- Row counts reconcile before and after migration.
- Every attendance employee ID maps to a known employee.
- Factory mapping is complete and unique.
- Employee wage/OT rates match the source exactly; no defaults are substituted.
- Payroll totals are calculated from verified records and compared.
- Auth/profile/factory access tested using approved admin, supervisor, inactive user and unapproved user.
- RLS policies deny anon reads/writes and enforce company/factory scoping.
- Worker portal tests confirm one worker cannot read another worker's profile/payroll.
- Edge Function secrets are set without exposing values.
- Production Security Advisor reviewed after staged changes.

## Cutover boundary
No production DDL, data writes, function deployments, PR merges, or Dev project deletion are authorized by this preflight. Apply a separately reviewed migration only after staging validation.
