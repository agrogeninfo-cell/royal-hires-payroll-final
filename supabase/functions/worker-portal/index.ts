import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedOrigins = new Set([
  'https://agrogeninfo-cell.github.io',
  'https://payroyalsri.netlify.app',
  'capacitor://localhost',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://localhost',
]);
const jsonHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && allowedOrigins.has(origin) ? origin : 'https://agrogeninfo-cell.github.io',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
  'Pragma': 'no-cache',
});
const reply = (body: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(body), { status, headers: jsonHeaders(origin) });
const enc = new TextEncoder();
const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes));
const unb64 = (value: string) => Uint8Array.from(atob(value), c => c.charCodeAt(0));
const randomBytes = (length: number) => crypto.getRandomValues(new Uint8Array(length));
async function sha256(value: string): Promise<string> {
  return b64(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(value))));
}
async function pinHash(pin: string, salt: string): Promise<string> {
  const material = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: unb64(salt), iterations: 210000, hash: 'SHA-256' }, material, 256);
  return b64(new Uint8Array(bits));
}
const validPin = (pin: string) => /^\d{6,10}$/.test(pin);
const validMemberId = (id: string) => /^[A-Z0-9-]{3,40}$/.test(id);
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const adminClient = () => createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const publicClient = () => createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  if (req.method === 'OPTIONS') return new Response('ok', { headers: jsonHeaders(origin) });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405, origin);
  if (!supabaseUrl || !anonKey || !serviceKey) return reply({ error: 'Portal service is not configured.' }, 503, origin);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply({ error: 'Invalid request.' }, 400, origin); }
  const action = typeof body.action === 'string' ? body.action : '';
  const db = adminClient();

  if (action === 'admin-set-pin') {
    const authorization = req.headers.get('Authorization') || '';
    if (!authorization.startsWith('Bearer ')) return reply({ error: 'Administrator sign-in required.' }, 401, origin);
    const caller = publicClient();
    const { data: authData, error: authError } = await caller.auth.getUser(authorization.slice(7));
    if (authError || !authData.user) return reply({ error: 'Administrator sign-in required.' }, 401, origin);
    const { data: profile } = await db.from('profiles')
      .select('company_id, role, is_active, approval_status')
      .eq('user_id', authData.user.id).maybeSingle();
    if (!profile || profile.role !== 'admin' || profile.is_active !== true || profile.approval_status !== 'approved') {
      return reply({ error: 'Administrator permission required.' }, 403, origin);
    }
    const memberId = typeof body.memberId === 'string' ? body.memberId.trim().toUpperCase() : '';
    const pin = typeof body.pin === 'string' ? body.pin : '';
    if (!validMemberId(memberId) || !validPin(pin)) return reply({ error: 'Use a valid Member ID and a 6–10 digit PIN.' }, 400, origin);
    const { data: employee } = await db.from('app_records').select('record_id,payload')
      .eq('company_id', profile.company_id).eq('collection_name', 'employees').eq('record_id', memberId).maybeSingle();
    if (!employee || employee.payload?.id !== memberId) return reply({ error: 'Worker record not found in your company. Sync and verify the Member ID first.' }, 404, origin);
    const salt = b64(randomBytes(16));
    const hash = await pinHash(pin, salt);
    const { error: upsertError } = await db.from('worker_portal_credentials').upsert({
      company_id: profile.company_id, member_id: memberId, employee_record_id: employee.record_id,
      pin_salt: salt, pin_hash: hash, is_active: true, failed_attempts: 0, locked_until: null,
      pin_changed_at: new Date().toISOString(), updated_at: new Date().toISOString(), created_by: authData.user.id,
    }, { onConflict: 'company_id,member_id' });
    if (upsertError) return reply({ error: 'Could not save the worker PIN. Ensure the portal migration has been applied.' }, 500, origin);
    return reply({ ok: true, memberId, message: 'PIN set. Share it privately with the worker; it cannot be retrieved later.' }, 200, origin);
  }

  if (action === 'login') {
    const memberId = typeof body.memberId === 'string' ? body.memberId.trim().toUpperCase() : '';
    const pin = typeof body.pin === 'string' ? body.pin : '';
    if (!validMemberId(memberId) || !validPin(pin)) return reply({ error: 'Invalid Member ID or PIN.' }, 401, origin);
    const { data: matches, error } = await db.from('worker_portal_credentials').select('*')
      .eq('member_id', memberId).eq('is_active', true).limit(2);
    if (error || !matches || matches.length !== 1) {
      await new Promise(resolve => setTimeout(resolve, 350));
      return reply({ error: 'Invalid Member ID or PIN.' }, 401, origin);
    }
    const credential = matches[0];
    if (credential.locked_until && new Date(credential.locked_until).getTime() > Date.now()) {
      await new Promise(resolve => setTimeout(resolve, 350));
      return reply({ error: 'Sign-in temporarily unavailable. Please try again later or contact the office.' }, 429, origin);
    }
    const candidate = await pinHash(pin, credential.pin_salt);
    if (candidate !== credential.pin_hash) {
      // Use a database-side atomic update so concurrent bad PIN attempts cannot
      // overwrite one another and bypass the five-attempt lockout threshold.
      await db.rpc('record_worker_portal_failed_attempt', { p_credential_id: credential.id });
      await new Promise(resolve => setTimeout(resolve, 350));
      return reply({ error: 'Invalid Member ID or PIN.' }, 401, origin);
    }
    const token = b64(randomBytes(32)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
    const { error: sessionError } = await db.from('worker_portal_sessions').insert({
      credential_id: credential.id, token_hash: tokenHash, expires_at: expiresAt,
    });
    if (sessionError) return reply({ error: 'Could not start a secure session. Please try again.' }, 500, origin);
    await db.from('worker_portal_credentials').update({ failed_attempts: 0, locked_until: null }).eq('id', credential.id);
    return reply({ token, expiresAt }, 200, origin);
  }

  const token = typeof body.token === 'string' ? body.token : '';
  if (token.length < 32 || token.length > 200) return reply({ error: 'Please sign in again.' }, 401, origin);
  const tokenHash = await sha256(token);
  const { data: session } = await db.from('worker_portal_sessions')
    .select('id,expires_at,credential_id,worker_portal_credentials(id,company_id,member_id,employee_record_id,is_active)')
    .eq('token_hash', tokenHash).is('revoked_at', null).gt('expires_at', new Date().toISOString()).maybeSingle();
  const credential = session?.worker_portal_credentials;
  if (!session || !credential || !credential.is_active) return reply({ error: 'Session expired. Please sign in again.' }, 401, origin);

  if (action === 'logout') {
    await db.from('worker_portal_sessions').update({ revoked_at: new Date().toISOString() }).eq('id', session.id);
    return reply({ ok: true }, 200, origin);
  }
  if (action !== 'me') return reply({ error: 'Unsupported action.' }, 400, origin);

  const companyId = credential.company_id;
  const employeeId = credential.employee_record_id;
  const [employeeResult, factoryResult, payrollResult] = await Promise.all([
    db.from('app_records').select('record_id,payload').eq('company_id', companyId).eq('collection_name', 'employees').eq('record_id', employeeId).maybeSingle(),
    db.from('app_records').select('record_id,payload').eq('company_id', companyId).eq('collection_name', 'factory_configs'),
    db.from('app_records').select('record_id,payload').eq('company_id', companyId).eq('collection_name', 'payroll_runs'),
  ]);
  if (employeeResult.error || factoryResult.error || payrollResult.error || !employeeResult.data) {
    return reply({ error: 'Worker records are not available yet. Please contact the office.' }, 503, origin);
  }
  const e = employeeResult.data.payload || {};
  if (String(e.id || employeeResult.data.record_id).toUpperCase() !== credential.member_id) {
    return reply({ error: 'Worker record verification failed. Contact the office.' }, 403, origin);
  }
  const factories = new Map((factoryResult.data || []).map((f: any) => [String(f.payload?.id || f.record_id), String(f.payload?.name || '')]));
  const payrolls = (payrollResult.data || []).flatMap((row: any) => {
    const run = row.payload || {};
    if (!['approved', 'paid'].includes(String(run.status || '').toLowerCase())) return [];
    const item = Array.isArray(run.items) ? run.items.find((it: any) => String(it.employeeId || '').toUpperCase() === credential.member_id) : null;
    if (!item) return [];
    return [{
      payrollNumber: String(run.payrollNumber || row.record_id),
      periodStart: String(run.periodStart || ''),
      periodEnd: String(run.periodEnd || ''),
      status: String(run.status),
      daysWorked: Number(item.daysWorked || 0),
      grossEarnings: Number(item.grossEarnings || 0),
      totalMealDeductions: Number(item.totalMealDeductions || 0),
      breakfastCount: Number(item.breakfastCount || 0),
      breakfastCost: Number(item.breakfastCost || 0),
      lunchCount: Number(item.lunchCount || 0),
      lunchCost: Number(item.lunchCost || 0),
      dinnerCount: Number(item.dinnerCount || 0),
      dinnerCost: Number(item.dinnerCost || 0),
      totalDeductions: Number(item.totalDeductions || 0),
      netPayable: Number(item.netPayable || 0),
      amountPaid: Number(item.amountPaid || 0),
      remainingBalance: Number(item.remainingBalance || 0),
      paymentStatus: String(item.paymentStatus || 'unpaid'),
    }];
  }).sort((a: any, b: any) => String(b.periodEnd).localeCompare(String(a.periodEnd)));
  return reply({
    profile: {
      memberId: credential.member_id,
      fullName: String(e.fullName || ''),
      phone: String(e.phone || ''),
      status: String(e.status || ''),
      factory: factories.get(String(e.currentFactoryId || '')) || '',
    },
    payrolls,
  }, 200, origin);
});
