# Royal Pay fixed-role username login

This change replaces the public sign-up and Google sign-in controls with username/password login for exactly two allowed usernames. Passwords are never stored in this repository or embedded in client code. Supabase Auth validates the password, and the Edge Function verifies the account's approved role before returning a session. The existing AuthGate still loads the profile and applies factory-scope checks.

## Required Supabase setup before deployment

1. Confirm that each account already exists in Supabase Auth, with a valid email and password, and that the matching `profiles` row has the expected role, `is_active = true`, and `approval_status = 'approved'`.
   - `mdthusithd9` must map to a profile with role `admin`.
   - `royalhirespo9` must map to a profile with role `supervisor` and valid factory assignments/mappings.
2. Configure Edge Function secrets in the **royal-hires-dev** Supabase project. Never commit these values:
   - `ROYAL_PAY_ADMIN_EMAIL`: the existing Supabase Auth email for the Admin account.
   - `ROYAL_PAY_SUPERVISOR_EMAIL`: the existing Supabase Auth email for the Supervisor account.
   - Supabase provides `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions; verify they are available in the target project.
3. Deploy the function from a trusted development environment using the Supabase CLI:
   ```sh
   supabase link --project-ref dgoibyoxpuvmvscpdamz
   supabase secrets set ROYAL_PAY_ADMIN_EMAIL="admin-account-email"
   supabase secrets set ROYAL_PAY_SUPERVISOR_EMAIL="supervisor-account-email"
   supabase functions deploy royal-pay-username-login
   ```
   Replace the email placeholders with the actual existing account emails. Do not put passwords in these commands.
4. Verify both usernames, wrong passwords, a wrong-role profile, inactive/pending profiles, and an unassigned supervisor. Confirm all payroll tables retain their existing RLS policies. Do not weaken RLS to make login work.

## Security notes

- Only the two named usernames are accepted by the Edge Function.
- Passwords are passed over HTTPS to Supabase Auth and are not logged or stored by this function.
- The server checks the profile role, active status, and approval status before returning the session.
- Existing app authorization and factory mapping checks remain in place.
- This function is an unauthenticated sign-in endpoint; monitor Supabase Auth and function logs for abuse and configure appropriate rate limits before production use.
- Rotate any password that has been shared in chat or another untrusted channel before enabling the accounts.
