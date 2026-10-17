# Royal Pay username-only login setup

This change replaces the public login UI with username/password sign-in and removes self-service registration and Google sign-in. Passwords are never stored in source code or in function environment variables.

## Required Supabase configuration

The Edge Function `royal-pay-username-auth` requires these server-side secrets:

- `ROYAL_PAY_ADMIN_USERNAME` — username for the existing approved Admin account
- `ROYAL_PAY_ADMIN_EMAIL` — that account's existing Supabase Auth email
- `ROYAL_PAY_SUPERVISOR_USERNAME` — username for the existing approved Supervisor account
- `ROYAL_PAY_SUPERVISOR_EMAIL` — that account's existing Supabase Auth email
- `AUTH_RECOVERY_REDIRECT_URL` — optional web fallback; defaults to the Royal Pay GitHub Pages URL. Native Android recovery uses `lk.royalhires.payroll://auth/callback?flow=recovery`.

Set these values in the Supabase project secrets / Edge Function environment. Example CLI shape (replace email placeholders with the real emails for the existing accounts; do not put passwords here):

```sh
supabase secrets set \
  ROYAL_PAY_ADMIN_USERNAME='mdthusithd9' \
  ROYAL_PAY_ADMIN_EMAIL='REPLACE_WITH_EXISTING_ADMIN_AUTH_EMAIL' \
  ROYAL_PAY_SUPERVISOR_USERNAME='royalhirespo9' \
  ROYAL_PAY_SUPERVISOR_EMAIL='REPLACE_WITH_EXISTING_SUPERVISOR_AUTH_EMAIL' \
  AUTH_RECOVERY_REDIRECT_URL='https://agrogeninfo-cell.github.io/royal-hires-payroll-final/'
```

Deploy the function from the repository root:

```sh
supabase functions deploy royal-pay-username-auth --project-ref dgoibyoxpuvmvscpdamz
```

The function uses the configured account email only on the server, authenticates the supplied password with Supabase Auth, then verifies that the resulting profile has the expected role, is active, and is approved. It returns a session only after those checks pass. Passwords are not logged or persisted by this function.

## Before enabling

1. In Supabase Dashboard → Authentication → URL Configuration → Redirect URLs, allow the exact native callback `lk.royalhires.payroll://auth/callback?flow=recovery` (or the callback pattern accepted by the current dashboard). Keep the existing web redirect allowlist entries.
2. Confirm both mapped emails belong to the intended existing Supabase Auth users.
3. Confirm the Admin profile role is `admin`, and the Supervisor profile role is `supervisor`; both must be active and approved.
4. Ensure the Supervisor has the intended factory assignment and existing cloud-to-local factory mapping. Existing `AuthGate` checks remain in place.
5. Keep Supabase RLS enabled and review every policy that grants access to payroll, attendance, employees, and invoices. Removing login options from the UI alone is not a database security boundary; any other previously approved account must be blocked by server-side policies or account administration before claiming that the entire backend is limited to these two identities.
6. Deploy the updated Edge Function and set its secrets before testing the new login UI. Until then, username sign-in intentionally returns a setup error.
7. Test correct and incorrect credentials, role mismatch, unapproved/inactive profiles, supervisor factory isolation, password recovery on Android, sign-out, and session refresh. Do not test against or rewrite historical payroll records.

No payroll calculations, historical records, table schemas, or existing data are changed by this UI/function addition.
