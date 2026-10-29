# Royal Hires — Final Cutover Gate

## Decision
**Production cutover is NOT READY.** Do not deploy the Dev auth/worker-portal architecture onto the current Production database yet.

## Evidence verified
- Production legacy schema: employees (20), attendance (6), settlements (0), meals (0).
- Production has no `companies`, `profiles`, `factories`, `user_factory_assignments`, or `app_records` foundation tables.
- Production has a legacy `royal-pay-login-v2` function that uses a different auth flow from the Dev version.
- Dev schema has the new company/profile/factory/app_records foundation and 151 app_records; these are Dev records and must not be copied to Production without reconciliation.
- Dev also has worker portal credentials/sessions tables, but Production does not.
- Production Security Advisor reports RLS disabled on `employees`, `attendance`, and `settlements`, with permissive policies; `meals` has RLS enabled but no policies.
- GitHub PR #40 remains a draft and explicitly says it has not been deployed to Production.

## Validation results — 2026-10-29
- Worker Portal Validation workflow for commit `177a119a8ec03307789d08a19a215e600e90f67d`: **PASS**. TypeScript validation, payroll/billing unit tests, and build with non-production placeholders all passed.
- Latest Worker Portal Validation for commit `c6328d5c9206b12c393cb4d9c0c6fa33819f0a4f`: **PASS** (run `40969660636`).
- Latest Android APK workflow for commit `c6328d5c9206b12c393cb4d9c0c6fa33819f0a4f`: **PASS** (run `40969660600`). Production configuration guard, TypeScript validation, payroll/billing/invoicing unit checks, production web build, Capacitor sync, callback/branding steps, debug APK build, and artifact upload all passed.
- Latest APK artifact: `royal-hires-payroll-production-debug-apk`, artifact ID `12939342600`, created 2026-10-29, expires 2026-11-12. Downloaded archive size ~6.8 MB; archive digest reported by GitHub: `sha256:60f5cb741dc40cdda1b562e12d8777816c67aaffd3c3680184c0e11ed46e96e3`. The extracted APK at `/mnt/data/Royal-Hires-Payroll-debug.apk` was identified as an Android package; its SHA-256 is `37075fdd46f6fc302c1d5f4d147bddecb41e75d98863aeb9646d01fb513751b4`.
- These are CI/build checks only. They do not prove production login, live cloud sync, worker isolation, or physical-device workflows.

## Blockers
1. Production company ID and authorised Admin Auth user have not been verified.
2. Production factory IDs and employee/attendance payload mappings have not been reconciled.
3. No verified migration has been tested against a Production-equivalent staging copy.
4. Replacement least-privilege RLS policies have not been proven against the existing client and the new app.
5. Updated Edge Function secrets and all login/recovery flows have not been validated for Production.
6. Worker portal has no Production schema or worker PIN setup.

## Final execution order
1. Verify authorized company/Admin identities and factory mapping.
2. Create the missing foundation schema through reviewed migrations, preserving legacy tables.
3. Seed verified company/factory/profile relationships without inventing identifiers.
4. Convert legacy rows to app_records using explicit stable IDs; reconcile counts and payroll values.
5. Add and test role/company/factory-scoped RLS policies; ensure anon cannot read/write payroll or personal data.
6. Deploy and test auth functions and secrets; run admin, supervisor, pending/inactive user, reset, worker PIN lockout/session and cross-worker isolation tests.
7. Build and deploy frontend pointing to the canonical Production project.
8. Run smoke tests and Security Advisor; only then consider retiring legacy access paths.
9. Keep Dev intact until a separate explicit retirement decision.

## Critical RLS issue
The following SQL is intentionally **not executed** because enabling RLS without correct policies can break current production access:
```sql
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
```
Before running it, design and validate the replacement policies. Reference: https://supabase.com/docs/guides/database/postgres/row-level-security

## Current change status
- Documentation-only changes are on `chore/production-migration-readiness`.
- No Production schema/data/function changes, PR merges, frontend deployment, or Dev deletion have been performed.
