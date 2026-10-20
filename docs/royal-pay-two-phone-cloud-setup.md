# Royal Pay: two-phone cloud setup

## Intended setup

Only the authorized Admin account signs in. The same Admin account can be used on both authorized phones. Supervisors do not need separate logins; use the Admin workflow to manage attendance and payroll. Supabase is the shared source of truth; IndexedDB and LocalStorage are per-device offline caches/backups, not a shared database.

## Authentication update

- The app calls the separate Supabase Edge Function `royal-pay-login-v2` for username/password sign-in and recovery-identity verification.
- Username login is restricted server-side to the configured Admin username `mdthusithd9` and its mapped email. Supervisor username configuration is not required or accepted.
- Passwords and service-role credentials must never be committed to the repository or shipped to the client.
- The function checks Supabase Auth and the user's profile role, active state, and approval status before returning a session.
- The database inspection found one active/approved Admin profile. Verify that `ROYAL_PAY_ADMIN_EMAIL` maps to that intended existing Supabase Auth user. Do not create a guessed profile or change role assignments.
- Configure/verify these server-side secrets in Supabase project `dgoibyoxpuvmvscpdamz`: `ROYAL_PAY_ADMIN_USERNAME` and `ROYAL_PAY_ADMIN_EMAIL`. Never place passwords in secrets or source code.
- The public login endpoint requires `verify_jwt = false` because users have no session before signing in; the function itself verifies the password and checks the Admin role server-side.

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
2. Sign in with the authorized Admin account on both devices.
3. Confirm both devices connect to the same company data.
4. Create a clearly marked test attendance record on Phone A and wait for successful sync.
5. Reopen/refresh Phone B and confirm the record appears exactly once.
6. Update the test record and confirm the change appears on Phone A.
7. Remove the test record only through the normal app workflow after both devices agree.
8. Test payroll/invoice calculations only with clearly marked test data after factory rates are verified.
9. Restore production use only after all checks pass; retain both backups.

CI success is not the same as a successful login or two-device cloud-sync test.
