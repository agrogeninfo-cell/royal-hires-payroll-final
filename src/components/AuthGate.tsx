import React, { useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import type { User } from '../types';
import { AuthScreen } from './AuthScreen';
import { SetPasswordScreen } from './SetPasswordScreen';
import { getCurrentSession, getSupabaseClient, handleNativeAuthCallback, isSupabaseConfigured, loadAccessProfile, signOut } from '../services/authService';

interface AuthGateProps {
  children: (user: User, onSignOut: () => Promise<void>) => React.ReactNode;
}

export const AuthGate: React.FC<AuthGateProps> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [accessState, setAccessState] = useState<'approved' | 'pending' | 'rejected' | 'unlinked' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [requiresPasswordSetup, setRequiresPasswordSetup] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const refresh = async (userId: string, email: string, mustSetPassword: boolean) => {
      try {
        const access = await loadAccessProfile(userId);
        if (!mounted) return;
        if (!access) {
          setUser(null);
          setAccessState('unlinked');
          setRequiresPasswordSetup(false);
        } else {
          setUser({ ...access.user, email });
          setAccessState(access.approvalStatus);
          setRequiresPasswordSetup(mustSetPassword);
        }
        setErrorMessage('');
      } catch (error) {
        if (mounted) setErrorMessage(error instanceof Error ? error.message : 'Could not verify your account access.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void getCurrentSession()
      .then((session) => {
        if (!mounted) return;
        if (session?.user) void refresh(session.user.id, session.user.email || '', session.user.user_metadata?.must_set_password === true);
        else setLoading(false);
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Could not check your sign-in session.');
          setLoading(false);
        }
      });

    const subscription = getSupabaseClient().auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') { setPasswordRecovery(true); setLoading(false); return; }
      setLoading(true);
      setUser(null);
      setAccessState(null);
      window.setTimeout(() => {
        if (!mounted) return;
        if (session?.user) void refresh(session.user.id, session.user.email || '', session.user.user_metadata?.must_set_password === true);
        else {
          setLoading(false);
          setRequiresPasswordSetup(false);
          setErrorMessage('');
        }
      }, 0);
    }).data.subscription;

    const processAuthCallback = (url: string) => {
      if (!mounted || !url.startsWith('lk.royalhires.payroll://auth/callback')) return;
      void handleNativeAuthCallback(url).catch((error) => {
        if (mounted) setErrorMessage(error instanceof Error ? error.message : 'Google sign-in callback failed.');
      });
    };

    let appListener: { remove: () => Promise<void> } | undefined;
    void App.addListener('appUrlOpen', ({ url }) => processAuthCallback(url)).then((listener) => {
      appListener = listener;
      // The OS may cold-start the app directly into the OAuth callback, in which
      // case appUrlOpen is not guaranteed to fire. Register the listener first,
      // then inspect the launch URL so neither return path is missed.
      void App.getLaunchUrl().then((launch) => {
        if (launch?.url) processAuthCallback(launch.url);
      }).catch((error) => {
        if (mounted) setErrorMessage(error instanceof Error ? error.message : 'Could not inspect the authentication callback URL.');
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (appListener) void appListener.remove();
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setAccessState(null);
    setRequiresPasswordSetup(false);
  };

  if (loading) {
    return <main className="min-h-screen bg-[#071D17] text-white flex items-center justify-center"><div className="text-center"><div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-2 border-emerald-300/30 border-t-emerald-300" /><p className="text-sm text-slate-300">Verifying Royal Pay access…</p></div></main>;
  }

  if (errorMessage && !user) {
    return <main className="min-h-screen bg-[#071D17] text-white flex items-center justify-center p-5"><section className="max-w-md rounded-2xl border border-rose-300/20 bg-white/[0.06] p-6"><h1 className="text-xl font-bold">Unable to verify access</h1><p role="alert" className="mt-3 text-sm text-rose-200">{errorMessage}</p><button onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-emerald-600 px-4 py-2.5 font-semibold">Try again</button></section></main>;
  }

  if (passwordRecovery) {
    return <SetPasswordScreen onComplete={() => { setPasswordRecovery(false); setRequiresPasswordSetup(false); }} />;
  }

  if (user && accessState === 'approved' && user.active && requiresPasswordSetup) {
    return <SetPasswordScreen onComplete={() => setRequiresPasswordSetup(false)} />;
  }

  if (!user || accessState !== 'approved' || !user.active) {
    if (!user && !accessState) return <AuthScreen />;
    const rejected = accessState === 'rejected';
    const title = rejected ? 'Access request declined' : accessState === 'unlinked' ? (user ? 'Factory assignment required' : 'Account setup required') : 'Waiting for administrator approval';
    const description = rejected
      ? 'Your Royal Pay access request was declined. Contact the Royal Hires administrator if you believe this is incorrect.'
      : accessState === 'unlinked'
        ? (user ? 'Your account is approved, but no assigned cloud factory can be mapped to this device’s local factory records. Ask the administrator to sync factory mappings and assign your factory before using attendance.' : 'Your sign-in succeeded, but this account is not linked to a Royal Hires company profile. Ask the administrator to invite or configure your account.')
        : 'Your account has been created, but payroll access remains locked until an administrator approves your role and factory permissions.';
    return <main className="min-h-screen bg-[#071D17] text-white flex items-center justify-center p-5"><section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-7"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-200"><span className="text-xl">⏳</span></div><h1 className="text-2xl font-bold">{title}</h1><p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>{errorMessage && <p role="alert" className="mt-3 text-sm text-rose-200">{errorMessage}</p>}<button onClick={() => void handleSignOut()} className="mt-6 w-full rounded-xl border border-white/15 px-4 py-3 font-semibold hover:bg-white/5">Sign out</button></section></main>;
  }

  return <>{children(user, handleSignOut)}</>;
};
