import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

type AccessRole = 'office_staff' | 'supervisor';
const validRole = (value: unknown): value is AccessRole =>
  value === 'office_staff' || value === 'supervisor';

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return json({ error: 'Authentication required.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'Server authentication configuration is incomplete.' }, 500);
  }

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await callerClient.auth.getUser();
  if (authError || !authData.user) return json({ error: 'Invalid or expired session.' }, 401);

  const { data: actor, error: actorError } = await adminClient
    .from('profiles')
    .select('user_id, company_id, role, is_active, approval_status')
    .eq('user_id', authData.user.id)
    .maybeSingle();

  if (actorError) return json({ error: 'Could not verify administrator permissions.' }, 500);
  if (!actor || actor.role !== 'admin' || !actor.is_active || actor.approval_status !== 'approved') {
    return json({ error: 'Only an approved company administrator can manage user access.' }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400);
  }

  const action = body.action;
  if (action === 'list-pending') {
    const { data: pending, error } = await adminClient
      .from('profiles')
      .select('user_id, company_id, full_name, role, approval_status, approval_requested_at')
      .eq('company_id', actor.company_id)
      .eq('approval_status', 'pending')
      .order('approval_requested_at', { ascending: true });

    if (error) return json({ error: 'Could not load pending access requests.' }, 500);
    const { data: authUsers, error: usersError } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) return json({ error: 'Could not load account email addresses.' }, 500);

    const byId = new Map((authUsers.users || []).map((user) => [user.id, user]));
    return json({
      pending: (pending || []).map((profile) => ({
        user_id: profile.user_id,
        full_name: profile.full_name,
        role: profile.role,
        approval_requested_at: profile.approval_requested_at,
        email: byId.get(profile.user_id)?.email || '',
      })),
    });
  }

  if (action === 'invite') {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const role = body.role;
    const factoryIds = Array.isArray(body.factoryIds)
      ? body.factoryIds.filter((value): value is string => typeof value === 'string')
      : [];

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !fullName || fullName.length > 120 || !validRole(role)) {
      return json({ error: 'Provide a valid email, full name, and an allowed non-admin role.' }, 400);
    }
    const factoryValidation = await validateFactories(adminClient, actor.company_id, factoryIds);
    if (factoryValidation) return json({ error: factoryValidation }, 400);

    const { data: invited, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName, must_set_password: true },
      redirectTo: Deno.env.get('AUTH_INVITE_REDIRECT_URL') || 'lk.royalhires.payroll://auth/callback',
    });
    if (inviteError || !invited.user) {
      return json({ error: inviteError?.message || 'Invitation could not be created.' }, 400);
    }

    const { error: profileError } = await adminClient.from('profiles').upsert({
      user_id: invited.user.id,
      company_id: actor.company_id,
      full_name: fullName,
      role,
      is_active: true,
      approval_status: 'approved',
      invited_by: actor.user_id,
      approved_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (profileError) return json({ error: 'Invitation was sent, but profile provisioning failed. Contact the system administrator.' }, 500);

    const assignmentError = await replaceAssignments(adminClient, actor.company_id, invited.user.id, factoryIds);
    if (assignmentError) return json({ error: assignmentError }, 500);

    return json({ success: true, invitedUserId: invited.user.id });
  }

  if (action === 'approve' || action === 'reject') {
    const targetUserId = typeof body.userId === 'string' ? body.userId : '';
    if (!targetUserId) return json({ error: 'A target user ID is required.' }, 400);

    const { data: target, error: targetError } = await adminClient
      .from('profiles')
      .select('user_id, company_id, approval_status')
      .eq('user_id', targetUserId)
      .eq('company_id', actor.company_id)
      .maybeSingle();
    if (targetError) return json({ error: 'Could not verify the access request.' }, 500);
    if (!target) return json({ error: 'Access request was not found in your company.' }, 404);
    if (targetUserId === actor.user_id) return json({ error: 'You cannot approve or reject your own account.' }, 400);

    if (action === 'reject') {
      const { error } = await adminClient.from('profiles').update({
        approval_status: 'rejected',
        is_active: false,
        approved_at: null,
      }).eq('user_id', targetUserId).eq('company_id', actor.company_id);
      if (error) return json({ error: 'Could not reject this access request.' }, 500);
      return json({ success: true });
    }

    const role = body.role;
    const factoryIds = Array.isArray(body.factoryIds)
      ? body.factoryIds.filter((value): value is string => typeof value === 'string')
      : [];
    if (!validRole(role)) return json({ error: 'Select an allowed non-admin role.' }, 400);
    const factoryValidation = await validateFactories(adminClient, actor.company_id, factoryIds);
    if (factoryValidation) return json({ error: factoryValidation }, 400);

    const { error: updateError } = await adminClient.from('profiles').update({
      role,
      is_active: true,
      approval_status: 'approved',
      approved_at: new Date().toISOString(),
    }).eq('user_id', targetUserId).eq('company_id', actor.company_id);
    if (updateError) return json({ error: 'Could not approve this access request.' }, 500);

    const assignmentError = await replaceAssignments(adminClient, actor.company_id, targetUserId, factoryIds);
    if (assignmentError) return json({ error: assignmentError }, 500);
    return json({ success: true });
  }

  return json({ error: 'Unsupported access action.' }, 400);
});

async function validateFactories(client: ReturnType<typeof createClient>, companyId: string, factoryIds: string[]) {
  if (new Set(factoryIds).size !== factoryIds.length) return 'Factory assignments contain duplicates.';
  if (factoryIds.length === 0) return null;
  const { data, error } = await client.from('factories').select('id').eq('company_id', companyId).in('id', factoryIds);
  if (error) return 'Could not validate factory assignments.';
  if ((data || []).length !== factoryIds.length) return 'One or more selected factories do not belong to this company.';
  return null;
}

async function replaceAssignments(client: ReturnType<typeof createClient>, companyId: string, userId: string, factoryIds: string[]) {
  const { error: deleteError } = await client.from('user_factory_assignments')
    .delete().eq('company_id', companyId).eq('user_id', userId);
  if (deleteError) return 'Could not update factory assignments.';
  if (factoryIds.length === 0) return null;
  const { error: insertError } = await client.from('user_factory_assignments').insert(
    factoryIds.map((factoryId) => ({ company_id: companyId, user_id: userId, factory_id: factoryId })),
  );
  return insertError ? 'Could not save factory assignments.' : null;
}
