# Royal Pay Sheets Bridge — API Contract Draft

This contract is for a future Supabase Edge Function. It is not a deployed endpoint and has no credentials. No app runtime code calls it yet.

## Proposed endpoint
`POST /functions/v1/royal-pay-sheets-bridge`

All requests require a valid Supabase user access token in the Authorization bearer header. The function must verify the token with Supabase Auth and load the current `profiles` row and `user_factory_assignments` from the trusted backend. Do not trust client-supplied role, company, or factory IDs.

## Request envelope
```json
{
  "action": "list",
  "entityType": "attendance",
  "factoryId": "local-factory-id",
  "cursor": null,
  "limit": 100
}
```

Write proposal:
```json
{
  "action": "upsert",
  "entityType": "attendance",
  "mutationId": "stable-client-generated-idempotency-key",
  "recordId": "existing-stable-record-id",
  "expectedRevision": 4,
  "record": {}
}
```

The empty record is intentionally not a valid sample payload. Validate the full entity against the current domain type before any write.

## Responses
- Success: `{ "ok": true, "records": [], "nextCursor": null }`
- Write success: `{ "ok": true, "recordId": "...", "revision": 5, "mutationId": "..." }`
- Conflict: `{ "ok": false, "code": "REVISION_CONFLICT", "recordId": "...", "currentRevision": 5 }`
- Denied: `{ "ok": false, "code": "FORBIDDEN" }`
- Validation failure: `{ "ok": false, "code": "INVALID_RECORD", "issues": [] }`

Avoid returning employee NICs or other personal data in logs and error messages.

## Mandatory server-side checks
1. Verify caller JWT; reject missing/expired/invalid sessions.
2. Load active, approved profile and company ID from trusted database records.
3. For supervisors, verify factory assignment on every list and write. Never trust the client-provided `factoryId`.
4. Enforce entity-level access rules; for example, supervisors should not be allowed to modify payroll, payments, invoices, receipts, factory rates, assignments, or audit logs unless a separate explicit policy permits it.
5. Validate exact field types, lengths, enums, numeric bounds, foreign keys, company scope, and allowed state transitions.
6. Enforce idempotency by `mutationId`; a retry with the same key must not duplicate a payment, invoice, receipt, attendance entry, or allocation.
7. Enforce `expectedRevision` for updates. Conflicts must be surfaced; never silently overwrite a concurrent financial edit.
8. Use server-side serialization/locking around read-modify-write operations. Sheets API append/update operations alone are not a transactional database.
9. Keep service-account OAuth credentials and all privileged keys in Supabase Edge Function secrets only.
10. Do not allow arbitrary sheet names, A1 ranges, or spreadsheet IDs from client requests. Use a server-side allowlist.
11. Record audit events for accepted writes and rejected sensitive actions without logging credentials or unnecessary personal data.
12. Rate-limit requests and return safe, non-sensitive errors.

## Offline behavior
- Keep the current IndexedDB/offline queue as the local offline cache.
- Each queued mutation needs a stable idempotency key and a base revision.
- Replay mutations one at a time per entity/record; on revision conflict, mark the local item conflicted and require review.
- Do not change the existing Supabase sync or activate dual-write while this bridge is in development.
- Do not replay deletes; this integration's first version should be additive/update-only.

## Google authorization setup required later
- Create a dedicated Google Cloud project owned by the company.
- Enable Google Sheets API.
- Create a dedicated service identity with access only to the intended spreadsheet.
- Share the spreadsheet privately with that identity, not publicly.
- Store credentials in Supabase Edge Function secrets. Never paste them into chat, source code, GitHub, app build variables, or the mobile client.
- Prefer workload identity or a supported keyless credential flow if available; otherwise use a securely managed server-side service-account credential with rotation.

## Current status and limitations
- Contract draft only.
- The assistant has not inspected the actual spreadsheet tabs or written to it.
- No Google Cloud project, service identity, Supabase secrets, or deployed function has been configured.
- A Sheets spreadsheet is not a transactional database; concurrent financial writes need server-side coordination and rigorous reconciliation. If those guarantees cannot be met, keep Supabase as the authoritative transactional store and use Sheets for reporting/export rather than claiming Sheets is the primary database.
