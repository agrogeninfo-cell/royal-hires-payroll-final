# Google Sheets Test Workbook Blueprint (Empty Spreadsheet)

The owner confirmed that the provided Google Sheet currently contains no data. This blueprint is for creating an isolated test workbook structure only. Do not migrate production records or connect the live app to it yet.

## Workbook identity
Spreadsheet ID (owner supplied): `1VGHSJtmkCFzKxXZqWZWaq8QGJbngUytQ3t650lEtWbY`

## Suggested tabs for the EMPTY test workbook
Use these exact tab names for the initial test workbook:
1. `Factories`
2. `Employees`
3. `Attendance`
4. `Overtime`
5. `PayrollRuns`
6. `EmployeePayments`
7. `Invoices`
8. `Receipts`
9. `BoardingLocations`
10. `BillingRateHistory`
11. `AuditLogs`
12. `SyncMetadata`

## Recommended columns
For record tabs, use the following base columns first:
`id, companyId, factoryId, payloadJson, revision, updatedAt, lastMutationId`

Why this shape:
- `id` keeps the existing Royal Pay record ID stable.
- `companyId` and `factoryId` are authorization/scope metadata.
- `payloadJson` preserves nested arrays and snapshot fields without silently dropping information.
- `revision` supports optimistic conflict detection.
- `updatedAt` supports diagnostics, but must not be the only conflict strategy.
- `lastMutationId` enables idempotent retries.

For `SyncMetadata`, use:
`entityType, recordId, companyId, factoryId, revision, updatedAt, lastMutationId, lastSyncedAt, syncState, lastErrorCode`

## Important: draft structure only
- The assistant has not created tabs or written to the spreadsheet; no Google Sheets connection is available in the current execution context.
- The tab names and columns above are a proposal to review, not a verified schema or live API contract.
- Do not put service-account keys, access tokens, or passwords in cells.
- Keep the spreadsheet private; do not enable “Anyone with the link”.
- Use synthetic test records only. Do not copy real employee NICs, phone numbers, wages, attendance, payments, invoices, or receipts.
- The app should continue using its current IndexedDB/Supabase behavior until a feature-flagged bridge is built and reviewed. No live cutover yet.

## Before implementation
- Confirm the workbook structure with the owner.
- Implement the server-side bridge using a fixed spreadsheet ID and fixed tab allowlist.
- Enforce Supabase Auth, company scope, role, and factory assignments on the server.
- Implement locking/serialization, idempotency keys, revision conflicts, and safe retry behavior.
- Verify tests and backup/rollback before considering any production switch.
