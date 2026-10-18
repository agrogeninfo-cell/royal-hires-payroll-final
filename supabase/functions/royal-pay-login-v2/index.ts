import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedOrigins = new Set([
  'https://agrogeninfo-cell.github.io',
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
]);

type AllowedAccount = { username: string; email: string; role: 'admin' | 'supervisor' };

function headers(origin: string | null) {
  const acceptedOrigin = origin && allowedOrigins.has(origin) ? origin : 'https://agrogeninfo-cell.github.io';
  return {
    'Access-Control-Allow-Origin': acceptedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  };
}
function reply(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: headers(origin) });
}
function getAllowedAccounts(): AllowedAccount[] {
  const result: AllowedAccount[] = [];
  const adminUser = Deno.env.get('ROYAL_PAY_ADMIN_USERNAME')?.trim().toLowerCase();
  const adminEmail = Deno.env.get('ROYAL_PAY_ADMIN_EMAIL')?.trim().toLowerCase();
  const supervisorUser = Deno.env.get('ROYAL_PAY_SUPERVISOR_USERNAME')?.trim().toLowerCase();
  const supervisorEmail = Deno.env.get('ROYAL_PAY_SUPERVISOR_EMAIL')?.trim().toLowerCase();
  if (adminUser && adminEmail) result.push({ username: adminUser, email: adminEmail, role: 'admin' });
  if (supervisorUser && supervisorEmail) result.push({ username: supervisorUser, email: supervisorEmail, role: 'supervisor' });
  if (result.some((a, i) => result.findIndex((b) => b.username === a.username) !== i)) {
    throw new Error('Duplicate username configuration.');
  }
  return result;
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: headers(origin) });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405, origin);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return reply({ error: 'Server authentication configuration is incomplete.' }, 500, origin);
  }

  let input: Record<string, unknown>;
  try {
    input = await req.json();
  } catch {
    return reply({ error: 'Invalid request.' }, 400, origin);
  }
  const action = input.action;
  if (!['sign-in', 'verify-reset-identity'].includes(String(action))) {
    return reply({ error: 'Unsupported authentication action.' }, 400, origin);
  }

  let accounts: AllowedAccount[];
  try {
    accounts = getAllowedAccounts();
  } catch {
    return reply({ error: 'Username login configuration needs administrator attention.' }, 503, origin);
  }
  if (!accounts.length) return reply({ error: 'Username login is not configured on the server.' }, 503, origin);

  const username = typeof input.username === 'string' ? input.username.trim().toLowerCase() : '';
  if (!username || username.length > 80) return reply({ error: 'Enter a valid username.' }, 400, origin);
  const account = accounts.find((item) => item.username === username);

  if (action === 'verify-reset-identity') {
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
    return reply({ eligible: Boolean(account && email && email.length <= 254 && account.email === email) }, 200, origin);
  }

  const password = typeof input.password === 'string' ? input.password : '';
  if (!account || password.length < 8 || password.length > 256) {
    return reply({ error: 'Invalid username or password.' }, 401, origin);
  }

  const publicClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await publicClient.auth.signInWithPassword({
    email: account.email,
    password,
  });
  if (authError || !authData.user || !authData.session) {
    return reply({ error: 'Invalid username or password.' }, 401, origin);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('user_id, role, is_active, approval_status')
    .eq('user_id', authData.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== account.role ||
      profile.is_active !== true || profile.approval_status !== 'approved') {
    await publicClient.auth.signOut().catch(() => undefined);
    return reply({ error: 'This account is not enabled for its assigned Royal Pay role. Contact the administrator.' }, 403, origin);
  }

  return reply({ session: authData.session }, 200, origin);
});
