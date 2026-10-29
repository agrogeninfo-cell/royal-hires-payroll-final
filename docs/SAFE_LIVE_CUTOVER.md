# Safe Live Supabase Cutover — Royal Hires

## Status

This is a **preflight audit only**. It does not deploy the app or change the live database. It was added on a separate branch so the production branch remains untouched.

## Known facts from source review

- Android/PWA source uses Supabase Auth and a two-way sync service.
- The source's fallback Supabase project is `royal-hires-dev` (`dgoibyoxpuvmvscpdamz`).
- The user-confirmed live payroll project is `jwghmsflabvzzhucuwsn`.
- Therefore, the production build must explicitly set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` for the intended project. Never set a service-role key in client/build variables.
- Source documentation says the development project's current auth/RLS migrations must not be applied to production without review.
- Existing local records are not automatically bulk-migrated by sync. Preserve a separate JSON backup from each phone before testing or migration.

## Step 1 — Run the read-only database audit

Open Supabase Dashboard and confirm the project reference in the project selector is `jwghmsflabvzzhucuwsn`. Open SQL Editor and run `supabase/diagnostics/live_cutover_readonly.sql`.

This script queries metadata only: column definitions, RLS flags, policies, and table grants. It does not select employee or payroll row values and makes no database changes.

Export the result grids as CSV or send screenshots with any credentials hidden. Do not share API secrets, JWTs, passwords, or actual employee salary records.

## Step 2 — Compare the live schema with app requirements

The Android app expects company-scoped tables such as `companies`, `profiles`, `factories`, `user_factory_assignments`, and `app_records`. The existing live project was previously reported to contain `employees`, `attendance`, `meals`, and `settlements`. These may represent two different schema designs; do not assume they are interchangeable.

Before any migration, map each source field to the app model and determine whether live data needs a controlled import. Do not rename, drop, overwrite, or bulk-copy production records as a shortcut.

## Step 3 — Configure the production build

Set the production build environment variables to the **live project's URL and publishable key**. Confirm the project ref is `jwghmsflabvzzhucuwsn`. The publishable key can be used in client apps when RLS policies are correct; the service-role key must remain server-side only.

Do not change the default app configuration or release a new APK until the live schema and required Edge Functions have been verified.

## Step 4 — Required release gates

- Review RLS and grants for every table used by the app.
- Confirm the expected Edge Functions exist and their secrets are configured server-side.
- Confirm the administrator account is approved and mapped to the intended company.
- Download JSON backups from each device before migration.
- Test login, attendance sync, payroll calculations, and invoices with clearly marked test data on two physical devices.
- Verify employee portal access separately: each employee must only access their own salary slip and meal bill.
- Do not declare production-ready until the above checks pass.

## Rollback / safety

No production SQL or data was changed by this audit branch. Keep the existing production app and backups available until the replacement has passed acceptance tests.
