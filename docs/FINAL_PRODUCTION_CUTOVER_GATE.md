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
- Android APK workflow for the same commit: **PASS**. Production configuration guard, TypeScript validation, payroll/billing/invoicing unit checks, production web build, Capacitor sync, callback/branding steps, debug APK build, and artifact upload all passed.
- APK artifact: `royal-hires-payroll-production-debug-apk`, approximately 7.1 MB. Artifact ID `12934449129`, SHA-256 `2d073cc89cee2e1aea04aec244de0de2076a4d601ae727dd5cc0fe22fcb54af5`, expires 2026-11-12.
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
