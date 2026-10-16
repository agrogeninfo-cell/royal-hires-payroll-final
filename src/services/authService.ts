import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import type { User, UserRole } from '../types';

// Safe client-side defaults for the authorized development project. Supabase publishable
// keys are designed for browser/mobile use; database RLS remains the security boundary.
// Override both values at build time when targeting a different environment.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || 'https://dgoibyoxpuvmvscpdamz.supabase.co';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || 'sb_publishable_vjf07PPacjxuRWAjgNqksQ_XtHNwGM8';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
export const AUTH_CALLBACK_URL = 'lk.royalhires.payroll://auth/callback';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error('Royal Pay authentication is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then rebuild the app.');
  }

  if (!client) {
    client = createClient(supabaseUrl, supabasePublishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: !Capacitor.isNativePlatform(),
        flowType: 'pkce',
      },
    });
  }
  return client;
}

export interface AccessProfile {
  user: User;
  companyId: string;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'unlinked';
}

const isUserRole = (role: unknown): role is UserRole =>
  role === 'admin' || role === 'office_staff' || role === 'supervisor';

export async function loadAccessProfile(userId: string): Promise<AccessProfile | null> {
  const supabase = getSupabaseClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('user_id, company_id, full_name, role, is_active, approval_status')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  if (!profile || !profile.company_id || !isUserRole(profile.role)) return null;

  const { data: assignments, error: assignmentError } = await supabase
    .from('user_factory_assignments')
    .select('factory_id')
    .eq('user_id', userId)
    .eq('company_id', profile.company_id);

  if (assignmentError) throw assignmentError;

  const assignedCloudFactoryIds = (assignments || []).map((item: { factory_id: string }) => item.factory_id);
  let assignedLocalFactoryIds: string[] = [];
  if (assignedCloudFactoryIds.length > 0) {
    const { data: mappings, error: mappingError } = await supabase
      .from('factories')
      .select('id, legacy_id')
      .eq('company_id', profile.company_id)
      .in('id', assignedCloudFactoryIds);
    if (mappingError) throw mappingError;
    assignedLocalFactoryIds = (mappings || [])
      .filter((item: { id: string; legacy_id: string | null }) => Boolean(item.legacy_id))
      .map((item: { id: string; legacy_id: string | null }) => item.legacy_id as string);
  }

  const baseApprovalStatus = profile.approval_status === 'approved'
    ? 'approved'
    : profile.approval_status === 'rejected'
      ? 'rejected'
      : 'pending';
  // Supervisors must have an explicit cloud-to-local factory mapping before any
  // local records can be displayed. UUIDs alone are not assumed to match legacy IDs.
  const scopeReady = profile.role !== 'supervisor'
    || (assignedCloudFactoryIds.length > 0 && assignedLocalFactoryIds.length === assignedCloudFactoryIds.length);
  const approvalStatus = baseApprovalStatus === 'approved' && !scopeReady ? 'unlinked' : baseApprovalStatus;

  return {
    companyId: profile.company_id,
    approvalStatus,
    user: {
      id: profile.user_id,
      name: profile.full_name || 'Royal Pay User',
      email: '',
      role: profile.role,
      active: Boolean(profile.is_active) && approvalStatus === 'approved',
      assignedFactoryIds: assignedLocalFactoryIds,
    },
  };
}

export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

export async function signInWithUsername(username: string, password: string): Promise<void> {
  const normalizedUsername = username.trim().toLowerCase();
  if (!normalizedUsername || !password) throw new Error('Enter your username and password.');

  const { data, error } = await getSupabaseClient().functions.invoke('royal-pay-username-login', {
    body: { username: normalizedUsername, password },
  });
  if (error) throw new Error('Sign-in failed. Check your credentials or contact the administrator.');
  if (!data?.access_token || !data?.refresh_token) {
    throw new Error('This account is not authorized for Royal Pay. Contact the administrator.');
  }

  const { error: sessionError } = await getSupabaseClient().auth.setSession({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
  });
  if (sessionError) throw sessionError;
}

function getWebAuthRedirectUrl(): string {
  // Respect Vite's configured base path (for example, the GitHub Pages repository path).
  return new URL(import.meta.env.BASE_URL, window.location.origin).toString();
}

export async function requestPasswordReset(email: string): Promise<void> {
  const redirectTo = Capacitor.isNativePlatform() ? AUTH_CALLBACK_URL : getWebAuthRedirectUrl();
  const { error } = await getSupabaseClient().auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) throw error;
}

export async function signUpWithPassword(fullName: string, email: string, password: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.signUp({
    email: email.trim(),
    password,
    options: { data: { full_name: fullName.trim() } },
  });
  if (error) throw error;
}

export async function signInWithGoogle(): Promise<void> {
  const native = Capacitor.isNativePlatform();
  const redirectTo = native ? AUTH_CALLBACK_URL : getWebAuthRedirectUrl();
  const { data, error } = await getSupabaseClient().auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: native,
      queryParams: { prompt: 'select_account' },
    },
  });
  if (error) throw error;
  if (native && data.url) await Browser.open({ url: data.url });
}

export async function handleNativeAuthCallback(url: string): Promise<void> {
  if (!url.startsWith(AUTH_CALLBACK_URL)) return;
  const { error } = await getSupabaseClient().auth.exchangeCodeForSession(url);
  await Browser.close().catch(() => undefined);
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw error;
}

export function subscribeToAuthChanges(callback: (session: Session | null) => void) {
  return getSupabaseClient().auth.onAuthStateChange((_event, session) => callback(session)).data.subscription;
}

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function sendAdminAccessAction<T = unknown>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await getSupabaseClient().functions.invoke('admin-user-access', { body });
  if (error) throw error;
  return data as T;
}
