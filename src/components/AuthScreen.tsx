import React, { useState } from 'react';
import { ArrowRight, Eye, EyeOff, KeyRound, ShieldCheck, UserRound } from 'lucide-react';
import { isSupabaseConfigured, signInWithUsername } from '../services/authService';

export const AuthScreen: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setErrorMessage('');
    try {
      await signInWithUsername(username, password);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign in. Check your username and password.');
    } finally {
      setBusy(false);
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <main className="min-h-screen bg-[#071D17] text-white flex items-center justify-center p-5">
        <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-7 shadow-2xl">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-300"><ShieldCheck size={28} /></div>
          <h1 className="text-2xl font-bold">Royal Pay sign-in unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">Authentication is not configured. Please contact the Royal Hires administrator.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#071D17] px-5 py-10 text-white flex items-center justify-center">
      <section className="w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200 shadow-lg shadow-emerald-950/40"><ShieldCheck size={32} /></div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">Royal Hires Private Limited</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">Royal Pay</h1>
          <p className="mt-2 text-sm text-slate-300">Secure workforce and payroll access</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur">
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-300/15 bg-emerald-400/5 p-3 text-sm text-emerald-100">
            <ShieldCheck size={19} className="shrink-0" />
            <span>Authorized Royal Hires accounts only</span>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <label className="block text-sm font-medium text-slate-200">Username
              <span className="relative mt-1.5 block">
                <UserRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400" placeholder="Enter your username" />
              </span>
            </label>
            <label className="block text-sm font-medium text-slate-200">Password
              <span className="relative mt-1.5 block">
                <KeyRound size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input required autoComplete="current-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-11 text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400" placeholder="Enter your password" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
              </span>
            </label>
            {errorMessage && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2.5 text-sm text-rose-200">{errorMessage}</p>}
            <button type="submit" disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
              {busy ? 'Verifying access…' : 'Sign in securely'} {!busy && <ArrowRight size={17} />}
            </button>
          </form>
          <p className="mt-5 text-center text-xs leading-5 text-slate-400">Access is limited to the two authorized Royal Hires accounts. Role approval and factory permissions are verified separately.</p>
        </div>
      </section>
    </main>
  );
};
