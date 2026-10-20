# Royal Pay Google Sheets Integration — Setup and Go-Live Checklist

## Purpose
A controlled setup checklist for the proposed Google Sheets bridge. Follow this before writing production data. The current app and Supabase sync remain active until the owner explicitly approves a tested cutover.

## Current development project observations (read-only)
- Supabase project `royal-hires-dev` (`dgoibyoxpuvmvscpdamz`) is ACTIVE_HEALTHY.
- Existing Edge Functions include `admin-user-access`, `royal-pay-username-auth`, and `royal-pay-login-v2`.
- Public tables include `profiles`, `factories`, `user_factory_assignments`, and `app_records`; RLS is enabled on these tables.
- `app_records` is the existing company/factory-scoped JSON record store and its current schema allowlists 11 collection names.
- The live project contains existing records. Do not change, migrate, delete, or dual-write them during initial setup.

## Stage A — Google setup (owner-operated, no secrets in chat)
- [ ] Open Google Cloud Console using the company's Google account.
- [ ] Create or select a dedicated project owned by the company.
- [ ] Enable Google Sheets API.
- [ ] Create a dedicated service identity for the backend only, or choose an approved keyless workload-identity mechanism if supported.
- [ ] Share the spreadsheet privately with that identity as Editor only if writes are required. Do not set the spreadsheet to public or “anyone with link”.
- [ ] Prefer a separate test spreadsheet for initial write testing. If the user only has one spreadsheet, create test-only tabs only after reviewing its contents and receiving permission.
- [ ] Store any required credential in Supabase Edge Function secrets through the Supabase dashboard/approved secret manager. Never put credentials in GitHub, the mobile app, Vite variables, spreadsheet cells, screenshots, or chat.
- [ ] Keep the spreadsheet ID in a server-side allowlist; clients cannot choose arbitrary spreadsheet IDs, tab names, or ranges.

## Stage B — backend bridge (implementation prerequisite)
- [ ] Implement a new Edge Function named `royal-pay-sheets-bridge` without replacing existing functions.
- [ ] Require Supabase JWT validation and independently load the active, approved profile and company scope.
- [ ] Verify assigned factory for every Supervisor operation.
- [ ] Enforce role/entity permissions server-side; supervisors must not write payroll, payments, invoices, receipts, billing rates, assignments, or audit logs unless a separately approved policy explicitly allows it.
- [ ] Validate each payload against current domain types and allowed values.
- [ ] Use stable mutation IDs and server-side idempotency to prevent duplicate attendance, payments, invoices, receipts, and allocations.
- [ ] Use revision checks and server-side serialization for concurrent writes. Surface conflicts instead of silently overwriting financial records.
- [ ] Avoid logging NICs, tokens, or unnecessary personal information.
- [ ] Add rate limits, safe error responses, and append-oriented audit events.
- [ ] Keep existing Supabase sync unchanged during proof of concept.

## Stage C — safe proof of concept
- [ ] Use synthetic data in a test spreadsheet/test tabs.
- [ ] Verify authorized Admin read/write.
- [ ] Verify Supervisor can access only assigned factory data.
- [ ] Verify denied access for unapproved users, inactive users, wrong company, and unassigned factories.
- [ ] Verify duplicate retry does not duplicate a payment, invoice, receipt, or attendance entry.
- [ ] Verify two concurrent edits result in an explicit conflict or a safely serialized write.
- [ ] Verify offline queue survives app restart and replays idempotently.
- [ ] Verify failures do not delete local data or incorrectly mark records as synced.
- [ ] Verify payroll calculation fixtures and invoice totals are unchanged.
- [ ] Run lint, type-check, unit tests, web build, Capacitor sync, and Android build on the feature branch.

## Stage D — dry-run reconciliation
- [ ] Create and validate a full JSON backup before any migration.
- [ ] Compare local, Supabase, and Sheets record IDs/counts in read-only mode.
- [ ] Report duplicate IDs, missing references, scope mismatches, and financial differences.
- [ ] Have an Admin review the reconciliation report.
- [ ] Do not auto-import legacy local records and do not broaden current factory scope implicitly.
- [ ] Keep Supabase sync enabled until the owner explicitly approves a controlled cutover.

## Stage E — explicit go-live approval
Do not proceed to production writes or make Sheets authoritative until the owner confirms all of the following:
1. The intended factory scope is correct.
2. The spreadsheet tabs/columns are reviewed and approved.
3. The test suite and reconciliation pass.
4. A verified backup and rollback plan exist.
5. The owner approves the cutover explicitly.

## Critical architectural note
Google Sheets is not a transactional relational database. If server-side locking, idempotency, revision handling, and reliable reconciliation cannot be demonstrated, keep Supabase `app_records` as the authoritative transactional store and use Google Sheets for reporting/export. Do not claim Sheets is the primary live database until this is proven.
