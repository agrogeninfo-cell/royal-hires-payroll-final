# Royal Pay Google Sheets Master Database — Implementation Plan

## Status
Planning only. This document does not change runtime behavior, database records, payroll calculations, Supabase configuration, or the user's Google Sheet.

## Goal
Evaluate a staged path to make the user's Google spreadsheet the central operational record store for Royal Pay, so Admin and assigned Factory Supervisors can share data across phones, while preserving offline operation and current payroll/invoice behavior.

Target spreadsheet ID supplied by the owner: `1VGHSJtmkCFzKxXZqWZWaq8GQJbngUytQ3t650lEtWbY`.

## Existing application constraints observed on main
- React + TypeScript + Vite + Capacitor Android app.
- IndexedDB database name is `LankaManpowerDB_v2`; stores include factories, employees, attendance, overtime, payroll_runs, employee_payments, invoices, receipts, boarding_locations, billing_rate_history, audit_logs, and offline_queue.
- Supabase Auth currently establishes identity and `loadAccessProfile` checks company, role, active/approved status, and factory assignments.
- `cloudSyncServiceV3.ts` currently synchronizes records to Supabase, uses a no-delete strategy, and has explicit factory scoping for Empire Teas and Millennium Teas. Do not silently broaden this scope.
- Legacy local records are not automatically migrated; existing app comments and project guidance require explicit review and a backup before migration.

## Recommended target architecture (proposal, not yet implemented)
1. **Mobile app:** retain IndexedDB as the offline cache and existing offline queue; keep current payroll calculations and invoice generation untouched.
2. **Identity and authorization:** retain Supabase Auth and profile/role/factory-assignment checks. Do not put service-account credentials or any privileged Google token in the mobile app.
3. **Trusted bridge:** use a Supabase Edge Function as the only app-facing API for Sheets operations. It must validate the caller's bearer token, load the active approved profile, verify company and assigned-factory scope, validate every requested record, and reject unauthorized writes.
4. **Google Sheets:** use the Google Sheets API from the trusted bridge with credentials held only in server-side secrets. Do not publish an unauthenticated Apps Script write endpoint and do not make the spreadsheet publicly editable.
5. **Concurrent edits:** use stable record IDs, idempotency keys, revision/version metadata, server-side serialization/locking, and conflict responses. Do not rely on timestamps alone for payroll, payments, or invoice conflict resolution.
6. **Auditability:** append auditable change events and retain before/after context where appropriate; never silently delete records.
7. **Transition:** keep the existing Supabase sync path enabled until a test-only integration passes and the owner explicitly approves a staged cutover. Do not dual-write production data until duplicate handling and rollback have been proven.

## Spreadsheet layout to validate before coding
The tab names and column mappings below are proposals. First compare them against actual TypeScript record types and current application usage; do not invent or drop fields.
- Factories
- Employees
- Attendance
- Overtime
- PayrollRuns
- EmployeePayments
- Invoices
- Receipts
- BoardingLocations
- BillingRateHistory
- AuditLogs
- SyncMetadata

Prefer a stable `id` column and explicit `companyId`, `factoryId`, `updatedAt`, and `revision` metadata where compatible with existing record shapes. Store complex nested payroll-run items as validated JSON only if spreadsheet reporting needs and API constraints are documented; otherwise normalize them carefully without changing calculation semantics.

## Required implementation phases
### Phase 0 — read-only inventory
- Inspect complete domain types, current sync code, offline queue handling, and relevant tests.
- Record every store/field and current access rule.
- Inspect spreadsheet tab names and headers through an authorized connection; no data edits.

### Phase 1 — isolated proof of concept
- Add a server-side bridge and a feature-flagged client adapter on a dedicated feature branch.
- Use a separate test spreadsheet or clearly isolated test tabs; never use production tabs for initial writes.
- Test authenticated reads/writes, role and factory authorization, duplicate retries, simultaneous edits, network failures, offline replay, and conflict handling.

### Phase 2 — data validation and dry run
- Download a complete JSON backup before any migration.
- Compare local, Supabase, and Sheets record IDs and counts without mutating data.
- Produce a review report for unmatched, duplicate, out-of-scope, or conflicting records.
- Require explicit Admin approval for each migration batch.

### Phase 3 — controlled rollout
- Roll out to one test account and test factory first.
- Verify Admin and Supervisor phones, offline edits, payroll calculations, invoice totals, partial payments, and receipts.
- Keep rollback to the existing sync path available until reconciliation is signed off.

### Phase 4 — cutover (owner approval required)
- Only after passing tests and reviewing the reconciliation report, decide whether Sheets becomes the authoritative store.
- Do not disable Supabase or remove existing records without a separate, explicit approval and verified backups.

## Acceptance criteria
- No change to payroll formulas, invoice calculations, historical records, database schema, or existing Supabase data during planning/PoC.
- Admin and Supervisor see only company/factory-authorized records.
- Retried requests do not create duplicate attendance, payments, invoices, or receipts.
- Conflicts are surfaced for review rather than silently overwriting financial records.
- Offline work survives app restart and syncs safely when connectivity returns.
- Full JSON backup and reconciliation report are available before any live cutover.
- Build, lint, unit tests, and Android packaging pass on the feature branch.

## Owner decisions needed before production cutover
- Confirm whether all existing factories should be in scope; current sync code explicitly scopes operational sync to Empire Teas and Millennium Teas.
- Confirm whether Google Sheets should be the authority for all records or only shared operational records, with Supabase retained for identity/access.
- Approve a separate test spreadsheet/test tabs and a migration dry run.
