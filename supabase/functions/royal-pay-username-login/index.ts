import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  try {
    const { username, password } = await req.json();
    if (typeof username !== "string" || typeof password !== "string" ||
        !username.trim() || !password || password.length > 256) {
      return json(400, { error: "Invalid credentials." });
    }

    const normalized = username.trim().toLowerCase();
    const accountConfig: Record<string, { email: string | undefined; role: "admin" | "supervisor" }> = {
      mdthusithd9: { email: Deno.env.get("ROYAL_PAY_ADMIN_EMAIL"), role: "admin" },
      royalhirespo9: { email: Deno.env.get("ROYAL_PAY_SUPERVISOR_EMAIL"), role: "supervisor" },
    };
    const account = accountConfig[normalized];
    if (!account || !account.email) return json(401, { error: "Invalid username or password." });

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("Username login function is missing required server configuration.");
      return json(503, { error: "Sign-in is temporarily unavailable. Contact the administrator." });
    }

    // Password authentication is performed by Supabase Auth. No password is stored or logged here.
    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: account.email.trim(),
      password,
    });
    if (authError || !authData.user || !authData.session) {
      return json(401, { error: "Invalid username or password." });
    }

    // Check account role and approval using a server-only key before returning a session.
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("role, is_active, approval_status")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (profileError) {
      await authClient.auth.signOut();
      console.error("Could not verify username login profile.");
      return json(503, { error: "Could not verify account permissions. Contact the administrator." });
    }

    if (!profile || profile.role !== account.role || profile.is_active !== true || profile.approval_status !== "approved") {
      await authClient.auth.signOut();
      return json(403, { error: "This account is not approved for the assigned Royal Pay role." });
    }

    return json(200, {
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
      token_type: authData.session.token_type,
      expires_in: authData.session.expires_in,
      expires_at: authData.session.expires_at,
    });
  } catch {
    return json(400, { error: "Invalid sign-in request." });
  }
});
