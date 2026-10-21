# Royal Pay — Single-User PIN + Google Sheets Primary Store Audit

## Scope and safety boundary

Owner requirements:
- Single-user Android app.
- Local personal PIN app lock.
- Google Sheets is intended to become the primary operational database.
- Preserve existing payroll formulas, records, IndexedDB schema, and working features.
- Audit before runtime changes; build and verify an Android APK after implementation.

Repository: `agrogeninfo-cell/royal-hires-payroll-final`
Base branch: `main`
Base commit audited: `5f4f2aec325f45df69077ac4cb38aefba3d68ad5`
Feature branch: `feature/royal-pay-single-user-pin-sheets-audit`

This commit is documentation-only. No payroll source, database schema, cloud data, or spreadsheet data is changed.

## Findings from repository source

### Stack and Android build
- React 19, TypeScript, Vite, Capacitor Android 7.4.3.
- `capacitor.config.ts`: app ID `lk.royalhires.payroll`, app name `Royal Hires Payroll`, web output `dist`.
- `.github/workflows/build-android-apk.yml` performs npm install, `npm run lint`, `npm run test:unit`, production Vite build, Capacitor sync, Android auth deep-link configuration, launcher branding, Gradle `assembleDebug`, and APK artifact upload.
- No repository-root npm lockfile was identified in the inspected main tree; reproducible dependency installation remains a build risk. Do not introduce dependency changes without checking compatibility.

### Current local persistence
- `src/db/indexedDb.ts` opens `LankaManpowerDB_v2` in non-demo mode, database version 1.
- Object stores include users, factories, employees, attendance, overtime, payroll_runs, employee_payments, invoices, receipts, boarding_locations, billing_rate_history, audit_logs, and offline_queue.
- `src/db/foreverStorage.ts` stores a best-effort LocalStorage mirror and snapshot history. It explicitly cannot guarantee zero data loss.
- The local schema must remain unchanged during the Sheets proof of concept. Do not clear, rename, recreate, or auto-migrate existing stores.

### Existing remote synchronization
- `src/services/cloudSyncServiceV3.ts` performs authenticated two-way synchronization with Supabase; `src/services/syncService.ts` coalesces overlapping sync triggers.
- Sync uses a no-delete strategy and contains special scoping for Empire Teas and Millennium Teas. Do not silently broaden that scope.
- `AUTH_SETUP.md` says legacy records are not automatically bulk-uploaded; backup, review, and explicit migration are required.
- `docs/GOOGLE_SHEETS_MASTER_DATABASE_PLAN.md` already proposes a trusted server-side bridge, test-only proof of concept, record IDs, idempotency, conflict handling, backup/reconciliation, and explicit owner approval before cutover.
- Keep the existing Supabase sync path available until the Sheets integration is proven and a cutover is separately approved.

### Payroll and reporting
- `src/services/payrollService.ts` currently uses daily wage = payable days × wage rate; weekly divisor 6; monthly divisor 26; approved OT hours × factory employee OT hourly rate; meal and boarding deductions depend on eligibility/recorded use; advances are deducted; net payable is floored at zero.
- These formulas are financial business rules and are out of scope for the storage migration.
- Existing billing and invoice rules must also be preserved. Employee payroll and factory billing remain separate.

### Authentication and requested PIN
- `src/components/AuthGate.tsx` and `src/services/authService.ts` currently use Supabase Auth and approved account profiles.
- Treat a personal PIN as a local app-unlock gate, not as cloud API authorization.
- Single-user scope means removing multi-staff workflows only if necessary and approved; do not remove the existing trusted cloud identity or server-side authorization until a replacement is specified and verified.
- PIN implementation must avoid storing the raw PIN. Use a native secure-storage approach where feasible, rate-limit failed attempts, support app background/foreground relocking, and ensure the PIN cannot bypass cloud authorization. Validate the secure-storage library and Android compatibility before adding a dependency.

## Google Sheets access status

The existing plan records a target spreadsheet ID: `1VGHSJtmkCFzKxXZqWZWaq8GQJbngUytQ3t650lEtWbY`.

Repository source can be audited through GitHub, but this session has not yet verified live spreadsheet access, worksheet tabs, header rows, ownership/sharing permissions, or record counts. Do not write to the spreadsheet until an authorized read-only inspection is available.

## Proposed implementation stages

1. **Read-only sheet inventory:** obtain authorized read access; record spreadsheet tabs, headers, formulas, protected ranges, record counts, and current data shape. Do not edit.
2. **Mapping report:** map every existing store/type and field to Sheets columns. Flag missing fields, duplicates, formula cells, oversized nested records, and unsupported values. No data writes.
3. **Backup and dry run:** create/verify a full JSON backup and a reconciliation report for local/Supabase/Sheets IDs and counts. Do not auto-import legacy data.
4. **Test-only bridge:** use a separate test spreadsheet or isolated test tabs. Server-side bridge must validate the authenticated owner, validate all inputs, avoid public unauthenticated write endpoints, and keep privileged Google credentials out of the APK.
5. **Client adapter behind feature flag:** preserve IndexedDB and current schema as offline cache/queue; use stable IDs, idempotency keys, revisions, conflict reporting, retry limits, and explicit sync status.
6. **Regression and security tests:** verify duplicate retry, concurrent edits, offline restart/replay, unauthorized requests, PIN retry/lock behavior, app relock, payroll totals, invoices, partial payments, receipts, and backup restore.
7. **Owner-reviewed cutover:** only after reconciliation, test evidence, and rollback plan are reviewed. Do not disable Supabase sync or promote Sheets to production authority without explicit approval.
8. **APK release verification:** run lint, unit tests, production build, Capacitor sync, Gradle debug APK build, verify artifact integrity, install and launch on Android, and test critical workflows on-device.

## Acceptance criteria

- No change to payroll formulas, historical payroll, invoice totals, local DB schema, or existing records during audit/PoC.
- No raw PIN or privileged Google credential stored in app-readable plain text.
- Google Sheets writes are authenticated, validated, idempotent, and auditable.
- Conflicts on payroll/payment/invoice records are surfaced; never silently overwritten by timestamp alone.
- Offline records survive restart and only report synced after server confirmation.
- Full backup and restore are tested with non-production data.
- All required checks pass on the feature branch and APK artifact integrity is verified.
- No merge, production cutover, or destructive migration without explicit owner approval.

## Current blockers

- Authorized read-only access to the target Google spreadsheet is not verified in this session.
- The complete field mapping, tab/header inventory, and live record reconciliation are therefore not yet possible.
- This audit note does not claim any runtime change, test run, or new APK build has succeeded.
