import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedOrigins = new Set([
  'https://agrogeninfo-cell.github.io',
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
]);

const NATIVE_AUTH_CALLBACK_URL = 'lk.royalhires.payroll://auth/callback';

function corsHeaders(origin: string | null) {
  const allowedOrigin = origin && allowedOrigins.has(origin) ? origin : 'https://agrogeninfo-cell.github.io';
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json',
  };
}

function json(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(origin) });
}

type Account = { username: string; email: string; role: 'admin' | 'supervisor' };

function configuredAccounts(): Account[] {
  const adminUsername = Deno.env.get('ROYAL_PAY_ADMIN_USERNAME')?.trim();
  const adminEmail = Deno.env.get('ROYAL_PAY_ADMIN_EMAIL')?.trim().toLowerCase();
  const supervisorUsername = Deno.env.get('ROYAL_PAY_SUPERVISOR_USERNAME')?.trim();
  const supervisorEmail = Deno.env.get('ROYAL_PAY_SUPERVISOR_EMAIL')?.trim().toLowerCase();
  if (!adminUsername || !adminEmail || !supervisorUsername || !supervisorEmail) {
    throw new Error('Username authentication is not fully configured on the server.');
  }
  return [
    { username: adminUsername.toLowerCase(), email: adminEmail, role: 'admin' },
    { username: supervisorUsername.toLowerCase(), email: supervisorEmail, role: 'supervisor' },
  ];
}

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('Origin');
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(origin) });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, origin);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Server authentication configuration is incomplete.' }, 500, origin);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400, origin);
  }

  let accounts: Account[];
  try {
    accounts = configuredAccounts();
  } catch {
    return json({ error: 'Username sign-in is not configured yet. Contact the Royal Pay administrator.' }, 503, origin);
  }

  const action = body.action;
  const username = typeof body.username === 'string' ? body.username.trim().toLowerCase() : '';
  if (!username || username.length > 80) return json({ error: 'Enter a valid username.' }, 400, origin);
  const account = accounts.find((item) => item.username === username);

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (action === 'reset-password') {
    // Use the same public response for unknown usernames to avoid account enumeration.
    if (!account) return json({ success: true, message: 'If the account is eligible, a reset email will be sent.' }, 200, origin);
    // Native requests need the registered app scheme and an explicit recovery marker.
    // Web requests keep the existing public GitHub Pages redirect.
    const redirectTo = origin === 'capacitor://localhost'
      ? `${NATIVE_AUTH_CALLBACK_URL}?flow=recovery`
      : Deno.env.get('AUTH_RECOVERY_REDIRECT_URL')
        || 'https://agrogeninfo-cell.github.io/royal-hires-payroll-final/';
    const { error } = await authClient.auth.resetPasswordForEmail(account.email, { redirectTo });
    if (error) {
      const rateLimited = /rate limit|too many requests/i.test(error.message);
      return json({ error: rateLimited ? 'Email rate limit exceeded. Please wait before trying again.' : 'Could not request a reset email. Please try again later.' }, rateLimited ? 429 : 400, origin);
    }
    return json({ success: true, message: 'If the account is eligible, a reset email will be sent.' }, 200, origin);
  }

  if (action !== 'sign-in') return json({ error: 'Unsupported authentication action.' }, 400, origin);
  if (!account || typeof body.password !== 'string' || body.password.length < 1 || body.password.length > 256) {
    return json({ error: 'Invalid username or password.' }, 401, origin);
  }

  const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
    email: account.email,
    password: body.password,
  });
  if (signInError || !signInData.user || !signInData.session) {
    return json({ error: 'Invalid username or password.' }, 401, origin);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('user_id, role, is_active, approval_status')
    .eq('user_id', signInData.user.id)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.role !== account.role ||
    profile.is_active !== true ||
    profile.approval_status !== 'approved'
  ) {
    await authClient.auth.signOut().catch(() => undefined);
    return json({ error: 'This account is not enabled for the assigned Royal Pay role. Contact the administrator.' }, 403, origin);
  }

  return json({ session: signInData.session }, 200, origin);
});
