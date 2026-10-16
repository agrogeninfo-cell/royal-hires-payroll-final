import React, { useState } from 'react';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { getSupabaseClient } from '../services/authService';

interface SetPasswordScreenProps { onComplete: () => void; }

export const SetPasswordScreen: React.FC<SetPasswordScreenProps> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    if (password.length < 8) {
      setErrorMessage('Use a password with at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('The passwords do not match.');
      return;
    }
    setBusy(true);
    try {
      const { error } = await getSupabaseClient().auth.updateUser({
        password,
        data: { must_set_password: false },
      });
      if (error) throw error;
      onComplete();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not set your password.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#071D17] px-5 py-10 text-white flex items-center justify-center">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.06] p-7 shadow-2xl">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-200"><ShieldCheck size={25} /></div>
        <h1 className="text-2xl font-bold">Set your Royal Pay password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-300">Your administrator invited you to Royal Pay. Create a password to enable Email/Password sign-in on this account.</p>
        <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-200">New password
            <span className="relative mt-1.5 block"><KeyRound size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-white outline-none focus:border-emerald-400" placeholder="At least 8 characters" /></span>
          </label>
          <label className="block text-sm font-medium text-slate-200">Confirm password
            <input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-emerald-400" placeholder="Enter the same password again" />
          </label>
          {errorMessage && <p role="alert" className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-3 py-2.5 text-sm text-rose-200">{errorMessage}</p>}
          <button disabled={busy} className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold shadow-lg shadow-emerald-950/40 hover:bg-emerald-500 disabled:opacity-60">{busy ? 'Saving password…' : 'Set password and continue'}</button>
        </form>
      </section>
    </main>
  );
};
