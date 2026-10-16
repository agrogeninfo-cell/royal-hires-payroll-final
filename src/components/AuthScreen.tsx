import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { isSupabaseConfigured, signInWithGoogle, signInWithPassword, signUpWithPassword, requestPasswordReset } from '../services/authService';

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'recovery'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
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
      setErrorMessage(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
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
          <p className="mt-3 text-sm leading-6 text-slate-300">Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in the build environment, configure Email and Google providers in Supabase, then rebuild. No demo administrator login is provided.</p>
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
          <div className="mb-5 grid grid-cols-2 rounded-xl bg-black/20 p-1 text-sm">
            <button type="button" onClick={() => { setMode('signin'); setErrorMessage(''); setNotice(''); }} className={`rounded-lg px-3 py-2.5 font-semibold transition ${mode === 'signin' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}>Sign in</button>
            <button type="button" onClick={() => { setMode('signup'); setErrorMessage(''); setNotice(''); }} className={`rounded-lg px-3 py-2.5 font-semibold transition ${mode === 'signup' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'}`}>Request access</button>
          </div>

          <button type="button" disabled={busy} onClick={() => void run(signInWithGoogle)} className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-white px-4 py-3 font-semibold text-slate-800 transition hover:bg-slate-100 disabled:opacity-60">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 text-sm font-bold text-blue-600">G</span>
            Continue with Google
          </button>

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-slate-500"><span className="h-px flex-1 bg-white/10" />or email<span className="h-px flex-1 bg-white/10" /></div>

          <form onSubmit={(event) => {
            event.preventDefault();
            if (mode === 'recovery') {
              void run(async () => {
                await requestPasswordReset(email);
                setNotice('If an account exists for this email, a password reset link has been sent.');
              });
            } else if (mode === 'signup') {
              void run(async () => {
                await signUpWithPassword(fullName, email, password);
                setNotice('Account request submitted. Verify your email if prompted. An administrator must approve access before payroll data becomes available.');
                setMode('signin');
                setPassword('');
              });
            } else {
              void run(() => signInWithPassword(email, password));
            }
          }} className="space-y-4">
            {mode === 'signup' && (
              <label className="block text-sm font-medium text-slate-200">Full name
                <input required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400" placeholder="Your full name" />
              </label>
            )}
            <label className="block text-sm font-medium text-slate-200">Email address
              <span className="relative mt-1.5 block">
                <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400" placeholder="name@company.com" />
              </span>
            </label>
            {mode !== 'recovery' && <label className="block text-sm font-medium text-slate-200">Password
              <span className="relative mt-1.5 block">
                <KeyRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required={mode !== 'recovery'} minLength={8} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-11 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400" placeholder="At least 8 characters" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </span>
            </label>}

            {errorMessage && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2.5 text-sm text-rose-200">{errorMessage}</p>}
            {notice && <p role="status" className="flex gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2.5 text-sm leading-5 text-emerald-100"><CheckCircle2 size={18} className="mt-0.5 shrink-0" />{notice}</p>}

            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? 'Please wait…' : mode === 'signup' ? 'Request account access' : 'Sign in securely'} {!busy && <ArrowRight size={17} />}
            </button>
            {mode === 'signin' && <button type="button" onClick={() => { setMode('recovery'); setErrorMessage(''); setNotice(''); }} className="mt-3 w-full text-sm text-emerald-300">Forgot password?</button>}
            {mode === 'recovery' && <button type="button" onClick={() => { setMode('signin'); setErrorMessage(''); setNotice(''); }} className="mt-3 w-full text-sm text-slate-300">Back to sign in</button>}
          </form>
          <p className="mt-5 text-center text-xs leading-5 text-slate-400">Access is limited to approved Royal Hires staff. Creating an account does not automatically grant payroll access.</p>
        </div>
      </section>
    </main>
  );
};
