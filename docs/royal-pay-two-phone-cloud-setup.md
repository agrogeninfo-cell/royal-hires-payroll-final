# Royal Pay: two-phone cloud setup

## Intended setup

Use the same authorized Royal Pay account on both Android phones. Supabase is the shared source of truth; IndexedDB and LocalStorage are per-device offline caches/backups, not a shared database.

## Important current state

- The GitHub Pages workflow intentionally sets `VITE_PUBLIC_DEMO_MODE=true`. The public URL therefore runs a browser-local demo and must not be used as the production shared-data app.
- The Android APK workflow builds with `VITE_PUBLIC_DEMO_MODE=false` so the APK uses the authenticated cloud-enabled application path.
- A successful CI build does not prove two-device synchronization. Verify this with two real devices after login and server configuration.
- Existing local records must be backed up on each device before migration. Never clear browser/app storage or restore one phone's backup over the other phone without reviewing it.

## Supabase prerequisites before using the production APK

1. In Supabase project `dgoibyoxpuvmvscpdamz`, confirm the intended existing Admin Auth user and profile are active and approved.
2. The current database inspection found one profile (Admin) and no Supervisor profile. The current username-auth Edge Function expects both an Admin and a Supervisor username/email pair, so it cannot be considered configured for the requested single shared login until that mismatch is resolved.
3. Configure Edge Function secrets through Supabase's secure dashboard/CLI only. Never place passwords, service-role keys, or secret values in repository files, chat, or client-side Vite variables.
4. Review and test Row Level Security for `app_records`, `factories`, `profiles`, `companies`, and `user_factory_assignments`. A publishable key is not a security boundary; database policies must require authenticated, approved users and scope records to the intended company.
5. Confirm the factory mappings and rates in cloud storage before processing payroll or creating invoices.

## Two-device acceptance test

1. Install the same production APK on both phones.
2. Sign in using the intended authorized account on each phone.
3. Confirm both phones show the same approved factories and expected records.
4. Create one clearly identified test attendance entry on Phone A and wait for successful sync.
5. Refresh/reopen Phone B and confirm the entry appears exactly once.
6. Update/approve the test record and confirm the change appears on Phone A.
7. Remove the test record only through the normal app workflow after both devices agree; do not edit the database directly.
8. Repeat with a small test payroll/invoice only after confirming factory rates and using clearly marked test data.
9. Restore production use only after all checks pass. Keep both JSON backups.

## Safety notes

Do not migrate records merely because they appear in the backup preview. Review each record's identity, date, factory, and amounts. Local records should remain intact during migration. CI success is not the same as cloud or two-device verification.
