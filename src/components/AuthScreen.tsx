import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, UserRound, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured, signInWithUsername, requestPasswordResetByUsername } from '../services/authService';

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'recovery'>('signin');
  const [username, setUsername] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setErrorMessage('');
    setNotice('');
    try {
      await action();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The request could not be completed. Please try again later.');
    } finally {
      setBusy(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <main className="min-h-screen bg-[#071D17] text-white flex items-center justify-center p-5">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-7 shadow-2xl">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300"><ShieldCheck size={28} /></div>
          <h1 className="text-2xl font-bold">Royal Pay authentication setup required</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">Authentication is not configured. Contact the system administrator.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#071D17] px-5 py-10 text-white flex items-center justify-center">
      <section className="w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200 shadow-lg shadow-emerald-950/40">
            <ShieldCheck size={32} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Royal Hires Private Limited</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Royal Pay</h1>
          <p className="mt-2 text-sm text-slate-300">Secure workforce and payroll access</p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
          <div className="mb-5 flex items-center justify-center rounded-xl bg-black/20 p-1 text-sm">
            <span className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow">
              {mode === 'signin' ? 'Sign in' : 'Password recovery'}
            </span>
          </div>

          <form onSubmit={(event) => {
            event.preventDefault();
            if (mode === 'recovery') {
              void run(async () => {
                await requestPasswordResetByUsername(username, recoveryEmail);
                setNotice('If the account is eligible, a password reset email will be sent. Check your inbox and spam folder.');
              });
            } else {
              void run(() => signInWithUsername(username, password));
            }
          }} className="space-y-4">
            <label className="block text-sm font-medium text-slate-200">Username
              <span className="relative mt-1.5 block">
                <UserRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required autoCapitalize="none" autoCorrect="off" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400" placeholder="Enter your username" />
              </span>
            </label>
            {mode === 'recovery' && <label className="block text-sm font-medium text-slate-200">Account email
              <input required type="email" autoCapitalize="none" autoComplete="email" value={recoveryEmail} onChange={(event) => setRecoveryEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-emerald-400" placeholder="Email registered to your account" />
            </label>}
            {mode === 'signin' && <label className="block text-sm font-medium text-slate-200">Password
              <span className="relative mt-1.5 block">
                <KeyRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required minLength={8} type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-11 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400" placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </span>
            </label>}

            {errorMessage && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2.5 text-sm text-rose-200">{errorMessage}</p>}
            {notice && <p role="status" className="flex gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2.5 text-sm leading-5 text-emerald-100"><CheckCircle2 size={18} className="mt-0.5 shrink-0" />{notice}</p>}

            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? 'Please wait…' : mode === 'recovery' ? 'Send reset link' : 'Sign in securely'} {!busy && <ArrowRight size={17} />}
            </button>
            {mode === 'signin' && <button type="button" disabled={busy} onClick={() => { setMode('recovery'); setErrorMessage(''); setNotice(''); setPassword(''); }} className="mt-3 w-full text-sm text-emerald-300 disabled:opacity-60">Forgot password?</button>}
            {mode === 'recovery' && <button type="button" disabled={busy} onClick={() => { setMode('signin'); setErrorMessage(''); setNotice(''); }} className="mt-3 w-full text-sm text-slate-300 disabled:opacity-60">Back to sign in</button>}
          </form>
          <p className="mt-5 text-center text-xs leading-5 text-slate-400">Access is restricted to authorized Royal Hires accounts. Permissions and factory access are verified before payroll data is shown.</p>
        </div>
      </section>
    </main>
  );
};
