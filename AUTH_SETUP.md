# Royal Pay Authentication Setup

This branch adds the client-side authentication foundation and the server-side admin access workflow. It does not migrate any IndexedDB payroll records to the cloud.

## Required configuration

1. Copy `.env.example` to `.env.local` for local development and set `VITE_SUPABASE_URL` plus `VITE_SUPABASE_PUBLISHABLE_KEY`. These are public client settings. Never place a Supabase service-role key in a Vite variable or in the Android app.
2. In GitHub repository Settings → Secrets and variables → Actions → Variables, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The Android workflow injects these values during the Vite build; if they are absent, the APK will build but show the authentication configuration message.
3. In Supabase Dashboard → Authentication → Providers, enable Email and Google. Configure Google OAuth with the OAuth Client ID/Secret from Google Cloud. The Google OAuth web client must allow the Supabase callback URL shown in the provider settings.
4. Add these URLs to Supabase Authentication → URL Configuration → Redirect URLs:
   - `lk.royalhires.payroll://auth/callback` (Android)
   - the exact HTTPS origin used by the hosted PWA
   - `http://localhost:3000` for local development only
5. For Android Google OAuth, configure the Android OAuth client with the SHA-1 certificate fingerprint for each signing certificate used. Debug and release fingerprints are different.
6. If invitation links should open a hosted PWA instead of the Android app, set the Edge Function secret `AUTH_INVITE_REDIRECT_URL` to that exact HTTPS origin and allowlist it in Supabase. The default invite redirect is the Android callback scheme.
7. Deploy the `admin-user-access` Edge Function from `supabase/functions/admin-user-access/index.ts` with JWT verification enabled. Supabase Edge Functions must have their normal `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` runtime secrets available. Never expose the service-role key to the client.

## First administrator bootstrap

There is deliberately no hardcoded client-side administrator. After enabling providers and signing in with the intended Royal Hires administrator account once, run this one-time statement in the **royal-hires-dev SQL Editor only**, replacing the email with the verified administrator email:

```sql
update public.profiles p
set role = 'admin',
    is_active = true,
    approval_status = 'approved',
    approved_at = now()
from auth.users u
where p.user_id = u.id
  and lower(u.email) = lower('REPLACE_WITH_ADMIN_EMAIL')
  and p.company_id = (select id from public.companies where name = 'Royal Hires Private Limited')
returning p.user_id, p.company_id, p.role, p.is_active, p.approval_status;
```

Confirm exactly one intended row is returned. Do not run this against production or assign admin to an unverified email. New self-signups otherwise stay pending and cannot open payroll screens.

## Access behavior

- Email/password and Google sign-in both use Supabase Auth.
- New self-signups are inserted into `public.profiles` as inactive/pending by a database trigger.
- Only an active company administrator can use the Edge Function to list pending requests, approve/reject a request, or invite an office staff/supervisor account.
- Invited users are assigned only to the same company as the inviting administrator. Supervisor access is limited by `user_factory_assignments` and existing RLS.
- The browser/native callback scheme is `lk.royalhires.payroll://auth/callback`. The Capacitor app ID remains `lk.royalhires.payroll`.

## Data preservation and rollout

- No IndexedDB stores are cleared or rewritten by authentication startup.
- No payroll formulas or historical financial records are changed.
- This does not yet migrate local IndexedDB data or make the current local sync queue write to Supabase. Do not describe data as cloud-synced until that separate implementation is completed and verified.
- First test on a separate Android test installation with synthetic data. Keep a JSON backup before any upgrade of a device containing real payroll records.
