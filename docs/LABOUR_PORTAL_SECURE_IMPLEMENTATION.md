# Labour Portal — Secure Implementation Plan

## Scope

Build a worker-facing portal connected to the same approved Supabase project as the Royal Hires Admin app. The portal must not use localStorage, static JSON, or browser-visible payroll data as its source of truth.

Workers sign in with their Royal Hires Member ID (for example, `RHTD200`) and an administrator-issued PIN. They can view only:
- Their own basic profile and current factory assignment.
- Published/approved salary slips.
- Their own meal usage and meal deductions for a selected payroll period.

No worker can browse other workers, attendance registers, factory billing rates, invoices, admin screens, or another worker's payroll.

## Security architecture (required before production)

1. Keep the portal in a separate route/app surface and keep all service-role credentials in Supabase Edge Function secrets only. Never place a service-role key in website or Android build variables.
2. Store a salted, slow password hash for each worker PIN. Do not store or log plaintext PINs. PIN creation/reset is an authenticated admin action; display a new PIN once and require a reset if compromise is suspected.
3. Use a server-side Edge Function for Member ID + PIN verification, throttling/lockout, session issuance, and all worker data reads. Do not query the broad `app_records` table directly from the browser.
4. Bind the session to one immutable employee record and company. Every data request must re-check that binding and return only records for that employee. Do not accept an arbitrary employee ID from the browser as authorization.
5. Add request throttling and temporary lockout after repeated failures, generic login errors, audit events without PINs, session expiry, logout, and a PIN reset/revocation path.
6. Publish salary slips only after payroll approval. Draft payroll must never appear in the portal.
7. Apply least-privilege RLS to the underlying tables and test cross-worker/cross-company access attempts. The Edge Function is not a substitute for securing the database.
8. Use separate development/test credentials and project configuration. Never deploy until the intended production project is explicitly confirmed and its RLS/security review passes.

## Data mapping

The existing admin app stores business records in the `app_records` collection table. A portal adapter must validate the actual record shapes before mapping:
- `employees`: match the authenticated employee's canonical Member ID.
- `payroll_runs`: return only approved/paid runs and the matching employee's payroll item.
- meal records: use the actual persisted meal/attendance model and period boundaries; do not infer a meal bill from unverified or draft data.

The app currently has local IndexedDB records as well as cloud records. Local-only records must not become visible to the portal until an admin has reviewed and explicitly synced them to the approved cloud project.

## Delivery sequence

- [x] Create an isolated feature branch based on the factory-wage/member-card work.
- [x] Remove hardcoded worker wage assumptions from new factory setup and new-worker creation; require approved factory rates.
- [ ] Implement and test the Edge Function, credential table, throttling and session validation.
- [ ] Implement responsive portal screens and loading/error/empty states.
- [ ] Add a portal entry link to the official website.
- [ ] Add unit/integration tests for login, expired sessions, PIN lockout, unpublished slips, cross-worker access and cross-company access.
- [ ] Configure approved production project variables and pass CI.
- [ ] Review production RLS policies and resolve the current broad-access policies before any live payroll data is entered.
- [ ] Obtain approval for deployment; do not merge or change production as part of this feature branch.

## Release gates

The portal is not production-ready until the tests above pass, all live tables have appropriate RLS, the production project is confirmed, and no secret/service-role key is present in client assets. This document does not authorize a production database change or deployment.
