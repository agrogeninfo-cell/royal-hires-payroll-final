# Royal Hires Labour Portal — Implementation Plan

## Product decision
- The agency Admin continues to create employee records and enter operational data daily in the existing payroll system.
- The existing system-generated Member ID (for example, RHSP200) remains the employee identifier. Do not generate a second ID or alter the ID-card/JPG workflow.
- Employees use the official Royal Hires website to reach the Labour Portal.
- Portal access requires Member ID + a separately issued PIN. Member ID alone is not authentication.
- A worker may view/download only their own profile, salary slip/settlement and meal bill. No access to other employees, agency-wide payroll, invoice, margin, or admin data.

## Known current-state findings
- The live Supabase project reported by the owner is `jwghmsflabvzzhucuwsn`.
- The current payroll app source has a fallback Supabase configuration for the separate development project `dgoibyoxpuvmvscpdamz`; a production build must not rely on that fallback.
- Current live audit exports show RLS disabled on `employees`, `attendance`, and `settlements`, with permissive `public/anon` policies. `meals` has RLS enabled but the audit showed no policies. Treat this as a security issue requiring a planned, tested fix.
- Website repository documentation says the official marketing website is currently separate from the payroll database.
- The current app uses local IndexedDB records and a company-scoped cloud sync design; legacy local records are not automatically bulk-migrated. Preserve device backups before any migration.

## Non-negotiable security design
1. Never expose a Supabase service-role/secret key in browser, website, Android, build variables, or this repository.
2. Do not query sensitive employee/payroll rows directly from the public website using only the publishable/anon key and Member ID.
3. Use a server-side/Edge Function flow to verify Member ID + PIN with rate limiting and generic failure responses. Store PINs only as strong salted hashes; never store or log plaintext PINs.
4. After successful verification, issue a short-lived, scoped session/token or use an appropriate Supabase Auth identity. Server-side authorization must bind every request to the one employee record. Do not trust a client-supplied employee ID after login.
5. Enable RLS and least-privilege grants for every table used by the portal. Test both allowed and denied paths, including attempts to change IDs and read other employees.
6. Create and reset worker PINs only through an authenticated Admin flow; do not send PINs in URLs or put them on ID cards.
7. Do not change production RLS/policies until the existing app's exact live database usage, required roles/functions, and a rollback plan are confirmed.

## Implementation gates
- [ ] Confirm the deployed app URL/project reference and actual production build environment (URL + publishable key only).
- [ ] Map live schema columns to app employee, settlement, attendance, and meal models using metadata only first.
- [ ] Back up each device's local data and confirm a restorable production backup.
- [ ] Identify whether the production project has required Auth configuration and deployed Edge Functions.
- [ ] Implement portal backend and PIN management in a non-production branch/project first.
- [ ] Add website navigation/link to the portal only after a real portal deployment URL exists; do not publish a fake or non-working link.
- [ ] Test: valid worker, wrong PIN, disabled worker, brute-force throttling, ID tampering, cross-worker salary access, meal bill access, Admin access separation, and app daily-entry/sync flows.
- [ ] Review RLS/grants and apply a reviewed production migration only after test acceptance and rollback preparation.
- [ ] Launch only after two-person/second-account cross-worker isolation checks pass.

## Scope for the first release
- Employee profile: approved fields only.
- Salary slip: only the employee's own finalized settlement for the selected pay period.
- Meal bill: only the employee's own meal entries/rates/total for the selected period.
- Download/print: only the authorized employee's own documents.
- No employee editing, attendance entry, payroll editing, invoice visibility, or agency financial reporting in the worker portal.

## Current status
Planning and metadata audit only. No portal has been deployed, no live policies were changed, and no production data was modified by this document.
