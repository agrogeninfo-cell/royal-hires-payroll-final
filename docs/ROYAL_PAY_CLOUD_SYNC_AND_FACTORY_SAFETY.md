# Royal Pay Cloud Sync, Demo Data and Factory Verification

## Safety contract
- Sync is additive/reconciling: it must never delete cloud or local business records.
- Payroll runs, payments, invoices, receipts, approved attendance and rate-history snapshots are financial records. A mismatch is a conflict, not permission to overwrite.
- A local factory ID is not a Supabase UUID. Resolve it through `public.factories.legacy_id` before syncing factory-scoped records.
- Factory supervisors are limited by server-side RLS and explicit `user_factory_assignments`; client filtering is not the security boundary.
- Do not treat company websites as evidence for workforce rates, overtime rules, special-day billing, shift schedules or deductions.

## Current factory configuration review

### Empire Teas
Business rules previously supplied by Royal Hires:
- Normal day shift: 08:00–17:00.
- Base billing example: LKR 1,525.
- Saturday example: LKR 1,875.
- Sunday/Poya example: LKR 3,600 plus the LKR 100 female night allowance where applicable.
- Female night allowance: LKR 100.
- OT example: LKR 225/hour.

These are owner-provided rules and must be checked against the latest approved rate sheet before activating or invoicing. Do not apply the female night allowance to male workers or unrelated factories.

### Millennium Teas
Current project test fixtures use LKR 3,000 male and LKR 2,500 female day rates and deliberately reject an unconfigured night rate. Confirm these values and effective dates against an approved Millennium Teas rate sheet before using them for a live invoice. No night rate should be inferred from a public company profile.

Public company profile sources (identity/profile only, not payroll rules):
- https://www.empireteas.com/
- https://www.srilankabusiness.com/exporters-directory/company-profiles/empire-teas-pvt-ltd/
- https://www.millenniumteas.com/
- https://www.millenniumteas.com/about-us/

## Safe demo cleanup procedure
1. Export a full local JSON backup and retain it outside the device.
2. Run a read-only inventory of factories, employees, attendance, payroll runs, payments, invoices, receipts, rate history and offline queue.
3. Classify demo candidates using exact known seed IDs/values and review them with an administrator. Similar names alone are not sufficient evidence.
4. Never delete a factory if any employee, attendance, payroll, invoice, receipt, payment or rate-history record references it.
5. Delete only confirmed demo-only records using an explicit reviewed allowlist and an auditable admin action. Never clear IndexedDB stores or run a broad SQL DELETE as a cleanup shortcut.
6. Re-open the app offline, verify counts and backup integrity, then reconnect and verify cloud/local counts and conflicts.

## Verification still required
- Supabase Auth needs an approved admin profile and configured providers before authenticated end-to-end sync can be tested.
- Test Admin, Office Staff and Factory Supervisor with separate accounts and factory assignments.
- Test two devices, offline attendance, retry after network restoration, duplicate attendance conflicts, concurrent edits, and RLS rejection for unassigned factories.
- Compare Empire and Millennium rates against owner-approved rate sheets before enabling live billing.
- Build CI proves compilation only; physical Android testing is still required.
