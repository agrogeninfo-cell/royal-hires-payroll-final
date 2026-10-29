# Royal Hires Production Migration Readiness

## Status
- Canonical production Supabase project: `jwghmsflabvzzhucuwsn` (`royal-hires`).
- Development project: `dgoibyoxpuvmvscpdamz` (`royal-hires-dev`).
- This document is a readiness plan only. It does not apply database changes, deploy functions, merge pull requests, or remove development resources.

## Production observations
- Legacy tables currently include `employees`, `attendance`, `settlements`, and `meals`.
- `employees`, `attendance`, and `settlements` have Row Level Security disabled while permissive `Allow all for anon` policies exist. This is a critical data-exposure risk.
- `meals` has RLS enabled but no policies, which may block normal client access.
- Production has a `royal-pay-login-v2` function that does not use the newer `profiles`-based approval model.

## Development-only architecture
The newer application expects `companies`, `profiles`, `factories`, `user_factory_assignments`, and `app_records`, plus role/company/factory-scoped RLS policies and helper functions. The worker portal additionally expects `worker_portal_credentials`, `worker_portal_sessions`, and `record_worker_portal_failed_attempt(uuid)`. The worker portal migration references `companies`, which is not currently present in the legacy Production schema.

## Required migration sequence
1. **Freeze the target architecture, not live traffic.** Confirm the intended production frontend and its exact commit/build, Supabase URL, auth flow, and any still-supported legacy client.
2. **Inventory and map data.** Read-only export/count and reconcile all legacy employee, attendance, settlement, and meal records against the `app_records` collection schema. Do not fabricate company IDs, employee record IDs, factory mappings, or wage values.
3. **Prepare auth foundation.** Create/seed the company, factory, profile and assignment records using verified IDs and existing approved users. Verify Auth users and all required function secrets without exposing secret values.
4. **Prepare RLS and grants.** Add narrowly scoped policies for authenticated, approved users and the intended roles. Worker PIN/session tables must remain inaccessible to anon/authenticated roles. Do not enable RLS on live tables until the replacement policies and app path have been validated together.
5. **Migrate data idempotently.** Use explicit deterministic record IDs and a mapping manifest; validate row counts, duplicate keys, foreign keys, dates, wages and totals before cutover. Preserve legacy rows until reconciliation is signed off.
6. **Deploy functions compatibly.** Stage the updated login and worker-portal functions only after schema and secrets are ready. Test admin, supervisor, inactive/pending users, reset flow, wrong PIN lockout, expiry/logout, and employee-only payroll visibility.
7. **Validate in a non-production environment.** Run migrations and smoke tests against a staging copy; confirm login, employee CRUD, attendance, OT, payroll, invoice, meals, factory scoping, and mobile UI.
8. **Cut over deliberately.** Only after approval and validation, deploy the frontend to the canonical production project, verify production health and data totals, and keep the development project intact until the user explicitly decides otherwise.

## Release gates
- No public/anon access to payroll or personal records.
- All live roles have tested least-privilege policies.
- Auth/profile/company/factory relationships are consistent.
- Payroll totals and legacy data counts reconcile.
- Worker portal cannot read another worker's records.
- Login, password recovery, and existing admin access pass end-to-end tests.
- Security Advisor findings are reviewed after changes.

## Known blocker
The production and development schemas are materially different. Applying development migrations directly to production is unsafe until the missing foundation schema, data mapping, auth identities, RLS policies, and function secrets are addressed. No Production database changes are authorized by this readiness document.

## References
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase database migrations: https://supabase.com/docs/guides/deployment/database-migrations
