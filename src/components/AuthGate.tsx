import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App as CapacitorApp } from '@capacitor/app';
import { ArrowRight, CheckCircle2, CircleAlert, KeyRound, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import type { User, UserRole } from '../types';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';

type AuthContextValue = { signOut: () => Promise<void> };
const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthGate');
  return value;
}

type ProfileRow = {
  user_id: string;
  company_id: string;
  full_name: string | null;
  role: string;
  is_active: boolean;
};

type GateState =
  | { status: 'loading' }
  | { status: 'signed_out' }
  | { status: 'pending'; email: string }
  | { status: 'blocked'; message: string }
  | { status: 'error'; message: string }
  | { status: 'approved'; user: User };

function toUserRole(value: string): UserRole | null {
  if (value === 'admin' || value === 'office_staff' || value === 'supervisor') return value;
  return null;
}

function authRedirectUrl(): string {
  return Capacitor.isNativePlatform()
    ? 'lk.royalhires.payroll://auth/callback'
    : `${window.location.origin}/auth/callback`;
}

export const AuthGate: React.FC<{ children: (user: User) => ReactNode }> = ({ children }) => {
  const [gate, setGate] = useState<GateState>({ status: 'loading' });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setGate({ status: 'error', message: 'Authentication is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to the deployment environment.' });
      return;
    }

    const client = supabase;
    let mounted = true;
    const resolveSession = async (session: Session | null) => {
      if (!mounted) return;
      if (!session) {
        setGate({ status: 'signed_out' });
        return;
      }

      const { data, error } = await client
        .from('profiles')
        .select('user_id, company_id, full_name, role, is_active')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!mounted) return;
      if (error) {
        setGate({ status: 'error', message: `Could not verify account access: ${error.message}` });
        return;
      }
      if (!data) {
        setGate({ status: 'pending', email: session.user.email ?? '' });
        return;
      }

      const profile = data as ProfileRow;
      const role = toUserRole(profile.role);
      if (!role) {
        setGate({ status: 'blocked', message: 'Your account has an unsupported role. Contact the Royal Hires administrator.' });
        return;
      }
      if (!profile.is_active) {
        setGate({ status: 'pending', email: session.user.email ?? '' });
        return;
      }

      let assignedFactoryIds: string[] | undefined;
      if (role === 'supervisor') {
        const { data: assignments, error: assignmentError } = await client
          .from('user_factory_assignments')
          .select('factory_id, factories(legacy_id)')
          .eq('user_id', session.user.id)
          .eq('company_id', profile.company_id);
        if (!mounted) return;
        if (assignmentError) {
          setGate({ status: 'error', message: 'Could not verify your factory assignments. Please try again or contact the administrator.' });
          return;
        }
        assignedFactoryIds = (assignments ?? []).flatMap((row: any) => {
          const legacyId = Array.isArray(row.factories) ? row.factories[0]?.legacy_id : row.factories?.legacy_id;
          return typeof legacyId === 'string' && legacyId.length > 0 ? [legacyId] : [];
        });
      }

      setGate({
        status: 'approved',
        user: {
          id: profile.user_id,
          name: profile.full_name?.trim() || session.user.email || 'Royal Hires User',
          email: session.user.email || '',
          role,
          active: true,
          assignedFactoryIds,
        },
      });
    };

    const { data: authListener } = client.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      // Defer database work until Supabase finishes its auth event callback.
      void Promise.resolve().then(() => resolveSession(session));
    });

    void client.auth.getSession().then(({ data, error }) => {
      if (error) {
        if (mounted) setGate({ status: 'error', message: error.message });
        return;
      }
      return resolveSession(data.session);
    });

    let appUrlListener: { remove: () => Promise<void> } | undefined;
    if (Capacitor.isNativePlatform()) {
      void CapacitorApp.addListener('appUrlOpen', async ({ url }) => {
        if (!url.startsWith('lk.royalhires.payroll://auth/callback')) return;
        const { error } = await client.auth.exchangeCodeForSession(url);
        if (error && mounted) setFormError(error.message);
        try { await Browser.close(); } catch { /* Browser may already be closed. */ }
      }).then((listener) => { appUrlListener = listener; });
    }

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
      if (appUrlListener) void appUrlListener.remove();
    };
  }, []);

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setPassword('');
    setGate({ status: 'signed_out' });
  };

  const handleEmailSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setFormError(''); setNotice('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to sign in. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) return;
    setBusy(true); setFormError(''); setNotice('');
    try {
      const native = Capacitor.isNativePlatform();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: authRedirectUrl(), skipBrowserRedirect: native },
      });
      if (error) throw error;
      if (native) {
        if (!data.url) throw new Error('Supabase did not return an OAuth URL.');
        await Browser.open({ url: data.url });
      } else if (data.url) {
        window.location.assign(data.url);
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Google sign-in could not be started.');
      setBusy(false);
    }
  };

  const handlePasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setFormError(''); setNotice('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: authRedirectUrl() });
      if (error) throw error;
      setNotice('If this email belongs to an account, a password-reset link has been sent.');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not request a password reset.');
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    if (newPassword.length < 12) {
      setFormError('Choose a password with at least 12 characters.');
      return;
    }
    setBusy(true); setFormError(''); setNotice('');
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setRecoveryMode(false); setNewPassword(''); setNotice('Password updated. You can continue using Royal Pay.');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Could not update password.');
    } finally {
      setBusy(false);
    }
  };

  if (gate.status === 'loading') {
    return <div className="min-h-screen grid place-items-center bg-[#071B14] text-white"><div className="flex items-center gap-3"><span className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-200 border-t-transparent" /><span>Verifying secure access…</span></div></div>;
  }

  if (gate.status === 'approved' && !passwordRecovery) {
    return <AuthContext.Provider value={{ signOut }}>{children(gate.user)}</AuthContext.Provider>;
  }

  const isPending = gate.status === 'pending';
  const isError = gate.status === 'error' || gate.status === 'blocked';
  const showRecovery = recoveryMode || passwordRecovery;

  return (
    <main className="min-h-screen bg-[#071B14] px-4 py-8 text-slate-100 flex items-center justify-center">
      <section className="w-full max-w-md overflow-hidden rounded-3xl border border-emerald-900/70 bg-[#0B2B20] shadow-2xl">
        <div className="px-7 pb-6 pt-8 text-center">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-amber-300/30 bg-emerald-950 text-amber-200"><ShieldCheck size={29} /></div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">ROYAL HIRES PRIVATE LIMITED</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Royal Pay</h1>
          <p className="mt-2 text-sm text-emerald-100/75">Secure payroll and workforce management</p>
        </div>

        <div className="border-t border-emerald-900/80 bg-white px-6 py-6 text-slate-800 sm:px-7">
          {isPending ? (
            <div className="py-5 text-center">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-amber-50 text-amber-700"><LockKeyhole size={24} /></div>
              <h2 className="text-lg font-semibold">Awaiting administrator approval</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Your identity is signed in, but payroll data stays locked until a Royal Hires administrator activates your profile and assigns the correct role and factory access.</p>
              {gate.status === 'pending' && gate.email && <p className="mt-3 break-all text-sm font-medium">{gate.email}</p>}
              <button type="button" onClick={() => void signOut()} className="mt-6 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-50">Sign out</button>
            </div>
          ) : isError ? (
            <div className="py-3 text-center">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-700"><CircleAlert size={24} /></div>
              <h2 className="text-lg font-semibold">Secure access unavailable</h2>
              <p className="mt-2 break-words text-sm leading-6 text-slate-600">{gate.status === 'error' || gate.status === 'blocked' ? gate.message : ''}</p>
              <button type="button" onClick={() => window.location.reload()} className="mt-6 w-full rounded-xl bg-emerald-900 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-800">Try again</button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold">{showRecovery ? 'Reset your password' : 'Sign in to continue'}</h2>
              <p className="mt-1 text-sm text-slate-500">{showRecovery ? 'Use your invited account email to recover access.' : 'Use a Google account or credentials invited by your administrator.'}</p>
              {formError && <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</div>}
              {notice && <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</div>}

              {showRecovery ? (
                <form onSubmit={passwordRecovery ? handlePasswordUpdate : handlePasswordReset} className="mt-5 space-y-4">
                  {!passwordRecovery && <label className="block text-sm font-medium">Email address<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" /></label>}
                  {passwordRecovery && <label className="block text-sm font-medium">New password<input type="password" required minLength={12} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" /></label>}
                  <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? 'Please wait…' : passwordRecovery ? 'Update password' : 'Send reset link'} <ArrowRight size={17} /></button>
                  <button type="button" onClick={() => { setRecoveryMode(false); setPasswordRecovery(false); setNotice(''); setFormError(''); }} className="w-full py-2 text-sm font-medium text-emerald-900">Back to sign in</button>
                </form>
              ) : (
                <>
                  <button type="button" disabled={busy} onClick={() => void handleGoogleSignIn()} className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold hover:bg-slate-50 disabled:opacity-60"><span className="text-lg font-bold text-blue-600">G</span> Continue with Google</button>
                  <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-400"><span className="h-px flex-1 bg-slate-200" /> or email <span className="h-px flex-1 bg-slate-200" /></div>
                  <form onSubmit={handleEmailSignIn} className="space-y-4">
                    <label className="block text-sm font-medium">Email address<span className="relative mt-1.5 block"><Mail className="absolute left-3 top-3.5 text-slate-400" size={17} /><input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" /></span></label>
                    <label className="block text-sm font-medium">Password<span className="relative mt-1.5 block"><KeyRound className="absolute left-3 top-3.5 text-slate-400" size={17} /><input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100" /></span></label>
                    <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-4 py-3 font-semibold text-white disabled:opacity-60">{busy ? 'Signing in…' : 'Sign in'} <ArrowRight size={17} /></button>
                  </form>
                  <button type="button" onClick={() => { setRecoveryMode(true); setNotice(''); setFormError(''); }} className="mt-4 w-full text-sm font-medium text-emerald-900 hover:underline">Forgot password?</button>
                  <p className="mt-5 border-t border-slate-200 pt-4 text-center text-xs leading-5 text-slate-500">Accounts are invitation-only. Contact your Royal Hires administrator for access. New accounts remain blocked until approved.</p>
                </>
              )}
            </>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 border-t border-emerald-900/70 px-4 py-3 text-xs text-emerald-100/60"><CheckCircle2 size={14} /> Protected by Supabase Auth and database Row Level Security</div>
      </section>
    </main>
  );
};
