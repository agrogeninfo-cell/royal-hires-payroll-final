# Royal Pay — Secure Authentication Setup (Sinhala / English)

## Included in this change

- Supabase email/password sign-in for administrator-invited accounts.
- Google OAuth sign-in.
- Protected app entry: a valid Supabase session alone is not enough; an active `public.profiles` row is required.
- Role comes from the database profile (`admin`, `office_staff`, `supervisor`), not a local role switch.
- Supervisor factory assignments are loaded from `public.user_factory_assignments`.
- Password-reset flow.
- Android OAuth callback: `lk.royalhires.payroll://auth/callback`.

## Required deployment configuration

Set these build-time environment variables in the local environment or GitHub Actions repository variables:

- `VITE_SUPABASE_URL`: URL for the existing `royal-hires-dev` project.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: that project's publishable key.

Use only the publishable key in the Android/client bundle. Never place `sb_secret_*` or `service_role` keys in `VITE_*` variables, source files, or APKs.

## Supabase Auth Dashboard

1. Open the `royal-hires-dev` project.
2. In Authentication → Providers, enable Email and Google. Configure the Google OAuth client ID/secret using the values from the Google Cloud OAuth client.
3. In Authentication → URL Configuration, add `lk.royalhires.payroll://auth/callback` to the allowed redirect URLs. Add the exact web/PWA origin used for development or hosting too.
4. Set the site URL to the actual deployed web origin; do not guess a production domain.
5. Keep database access protected by the existing RLS policies.

Google sign-in can create an Auth identity, but the app does not grant payroll access until an administrator has created/activated the corresponding profile. This is intentional.

## Initial administrator bootstrap

The development database currently has a Royal Hires company row but no active profile rows. Create the first Auth user through the Supabase Auth dashboard or invite flow. Then, using the exact Auth user UUID and the existing company UUID, insert one approved profile in the SQL editor:

```sql
insert into public.profiles (user_id, company_id, full_name, role, is_active)
values (
  '<AUTH_USER_UUID>'::uuid,
  '<ROYAL_HIRES_COMPANY_UUID>'::uuid,
  '<ADMIN_DISPLAY_NAME>',
  'admin',
  true
);
```

Replace all three placeholders deliberately. Do not create a second company row, do not change an existing user's role to bootstrap access, and do not run this statement until the intended Auth user UUID has been verified. The SQL above is documentation only; this repository change does not execute it.

## Invite and approve users

For the initial rollout, use Supabase Authentication → Users to invite the user's verified email. After the invited identity exists, create a `public.profiles` row for that Auth UUID with the correct company and approved role. Keep `is_active = false` until access is approved. For supervisors, create the appropriate `public.user_factory_assignments` rows as well.

The UI treats missing profiles and inactive profiles as pending approval and does not open payroll screens. Do not approve unknown emails or assign `admin` unless explicitly authorized.

An in-app invitation/approval management screen and a server-side invitation Edge Function are separate follow-up work; never call Supabase Admin APIs or use a service-role key from the client.

## Android updates

OAuth deep-link registration is applied to the generated Android manifest during the build. The app ID remains `lk.royalhires.payroll`. For update-in-place installation, keep the same application ID, increase the Android version code, and sign every release with the same protected release key. A debug APK signed by GitHub Actions is not a production update channel.

## Verification checklist

- [ ] TypeScript validation passes.
- [ ] Unit checks pass.
- [ ] Production web build passes.
- [ ] Capacitor sync and Android APK build pass.
- [ ] Email/password sign-in with an invited account works.
- [ ] Google OAuth returns to the app on a real Android device.
- [ ] A missing/inactive profile cannot access payroll screens.
- [ ] Admin, office staff and supervisor roles are loaded from database profiles.
- [ ] Supervisor access is restricted by RLS and factory assignments.
- [ ] Sign-out clears the Supabase session.
- [ ] No secrets are embedded in the client bundle.
