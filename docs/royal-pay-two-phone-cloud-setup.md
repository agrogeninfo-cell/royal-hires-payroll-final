# Royal Pay: two-phone cloud setup

## Intended setup

Use the authorized Admin account on the Admin phone and the authorized Supervisor account on the Supervisor phone (or the same approved account on both phones where operationally intended). Supabase is the shared source of truth; IndexedDB and LocalStorage are per-device offline caches/backups, not a shared database.

## Authentication update

- The app now calls the separate Supabase Edge Function `royal-pay-login-v2` for username/password sign-in and recovery-identity verification.
- The function reads the server-side allowlist for Admin `mdthusithd9` and Supervisor `royalhirespo9`; passwords and service-role credentials must never be committed to the repository or shipped to the client.
- Each login is checked against Supabase Auth and the user's profile role, active state, and approval status before a session is returned.
- The existing database inspection found one active/approved Admin profile and no Supervisor profile. The Supervisor login will remain blocked until the intended Supervisor Auth user has a correct profile and factory assignment/mapping. Do not create a guessed profile or assign a guessed factory.
- Configure/verify these server-side secrets in Supabase project `dgoibyoxpuvmvscpdamz`: `ROYAL_PAY_ADMIN_USERNAME`, `ROYAL_PAY_ADMIN_EMAIL`, `ROYAL_PAY_SUPERVISOR_USERNAME`, and `ROYAL_PAY_SUPERVISOR_EMAIL`. The mapped emails must belong to the intended existing Auth users. Never place passwords in secrets or source code.
- The public login endpoint requires `verify_jwt = false` because users have no session before signing in; the function itself verifies the password and checks the role server-side.

## Deployment modes

- The GitHub Pages workflow intentionally sets `VITE_PUBLIC_DEMO_MODE=true`. That public URL is a browser-local demo and must not be used as the production shared-data app.
- The Android APK workflow explicitly builds with `VITE_PUBLIC_DEMO_MODE=false` to use the authenticated cloud-enabled application path.
- A green CI build does not prove that two physical devices synchronize. Confirm the cloud connection and RLS first.

## Data and security safeguards

1. Export a JSON backup from each phone before migration or testing.
2. Review Row Level Security for `app_records`, `factories`, `profiles`, `companies`, and `user_factory_assignments`. A publishable key is not a security boundary. Policies must require authenticated, approved users and scope records to the intended company.
3. Confirm factory mappings and rates in cloud storage before payroll or invoice processing.
4. Do not clear app/browser storage or restore one phone's backup over the other phone without reviewing it.
5. Do not change payroll formulas, historical payroll/invoice records, or schema as part of login setup.

## Two-device acceptance test

1. Install the same production-mode APK on both Android phones.
2. Sign in using the intended authorized account on each device.
3. Confirm each account sees only its permitted role and factory scope.
4. Create a clearly marked test attendance record on Phone A and wait for successful sync.
5. Reopen/refresh Phone B and confirm the record appears exactly once.
6. Update the test record and confirm the change appears on Phone A.
7. Remove the test record only through the normal app workflow after both devices agree.
8. Test payroll/invoice calculations only with clearly marked test data after factory rates are verified.
9. Restore production use only after all checks pass; retain both backups.

CI success is not the same as a successful login or two-device cloud-sync test.
