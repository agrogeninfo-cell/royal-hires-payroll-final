import React, { useCallback, useEffect, useState } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { createPin, getPinConfig, getPinLockRemainingMs, verifyPin } from '../services/personalPinService';

interface PersonalPinGateProps {
  children: React.ReactNode;
}

type GateStatus = 'loading' | 'setup' | 'locked' | 'unlocked' | 'error';

export const PersonalPinGate: React.FC<PersonalPinGateProps> = ({ children }) => {
  const [status, setStatus] = useState<GateStatus>('loading');
  const [pin, setPin] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);

  const refreshLockRemaining = useCallback(async () => {
    try {
      setLockRemaining(await getPinLockRemainingMs());
    } catch {
      setLockRemaining(0);
    }
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      // This PIN gate is for the installed native app. The secure-storage plugin
      // explicitly uses unencrypted localStorage on the web.
      setStatus('unlocked');
      return;
    }

    let mounted = true;
    void getPinConfig()
      .then((config) => {
        if (mounted) setStatus(config ? 'locked' : 'setup');
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        setMessage(error instanceof Error ? error.message : 'Could not access secure PIN storage.');
        setStatus('error');
      });

    let appListener: { remove: () => Promise<void> } | undefined;
    void App.addListener('appStateChange', ({ isActive }) => {
      if (!mounted) return;
      if (!isActive) {
        setStatus((current) => current === 'unlocked' ? 'locked' : current);
        setPin('');
        setConfirmation('');
        setMessage('');
      } else {
        void refreshLockRemaining();
      }
    }).then((listener) => {
      appListener = listener;
    }).catch(() => {
      if (mounted) setMessage('App lock lifecycle monitoring could not start. Please restart Royal Pay.');
    });

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setStatus((current) => current === 'unlocked' ? 'locked' : current);
        setPin('');
        setConfirmation('');
        setMessage('');
      } else {
        void refreshLockRemaining();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      mounted = false;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (appListener) void appListener.remove();
    };
  }, [refreshLockRemaining]);

  useEffect(() => {
    if (status !== 'locked' || lockRemaining <= 0) return;
    const timeout = window.setTimeout(() => {
      void refreshLockRemaining();
    }, Math.min(lockRemaining, 1000));
    return () => window.clearTimeout(timeout);
  }, [status, lockRemaining, refreshLockRemaining]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      if (status === 'setup') {
        if (!/^\d{4,8}$/.test(pin)) {
          setMessage('PIN එකට ඉලක්කම් 4–8ක් භාවිත කරන්න.');
          return;
        }
        if (pin !== confirmation) {
          setMessage('PIN දෙක ගැළපෙන්නේ නැහැ. නැවත පරීක්ෂා කරන්න.');
          setConfirmation('');
          return;
        }
        await createPin(pin);
        setStatus('unlocked');
        setPin('');
        setConfirmation('');
        setMessage('');
        return;
      }

      const remaining = await getPinLockRemainingMs();
      if (remaining > 0) {
        setLockRemaining(remaining);
        setMessage(`Too many attempts. Try again in ${Math.ceil(remaining / 1000)} seconds.`);
        return;
      }
      const valid = await verifyPin(pin);
      setPin('');
      if (valid) {
        setStatus('unlocked');
        setMessage('');
        setLockRemaining(0);
      } else {
        setMessage('PIN එක වැරදියි. නැවත උත්සාහ කරන්න.');
        await refreshLockRemaining();
      }
    } catch (error) {
      setPin('');
      setMessage(error instanceof Error ? error.message : 'PIN verification failed. Please try again.');
      await refreshLockRemaining();
    } finally {
      setBusy(false);
    }
  };

  if (status === 'loading') {
    return <main className="min-h-screen bg-[#071D17] text-white flex items-center justify-center"><p className="text-sm text-emerald-100">Preparing secure app lock…</p></main>;
  }

  if (status === 'unlocked') return <>{children}</>;

  const isSetup = status === 'setup';
  const lockedSeconds = Math.ceil(lockRemaining / 1000);

  return (
    <main className="min-h-screen bg-[#071D17] text-white flex items-center justify-center p-5">
      <section className="w-full max-w-sm rounded-3xl border border-emerald-200/15 bg-white/[0.055] p-7 shadow-2xl shadow-black/30">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-200/20 bg-emerald-300/10 text-emerald-200">
          {isSetup ? <ShieldCheck className="h-8 w-8" /> : <LockKeyhole className="h-8 w-8" />}
        </div>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">ROYAL HIRES</p>
        <h1 className="mt-2 text-center text-2xl font-bold">{isSetup ? 'Create Personal PIN' : 'Royal Pay is Locked'}</h1>
        <p className="mt-3 text-center text-sm leading-6 text-slate-300">
          {isSetup
            ? 'Set a 4–8 digit PIN to protect payroll and employee information on this device.'
            : 'Enter your personal PIN to unlock payroll and employee information.'}
        </p>

        <form onSubmit={(event) => void submit(event)} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-200">
            {isSetup ? 'New PIN' : 'Personal PIN'}
            <input
              aria-label={isSetup ? 'New PIN' : 'Personal PIN'}
              autoComplete="off"
              autoFocus
              inputMode="numeric"
              maxLength={8}
              pattern="[0-9]{4,8}"
              type="password"
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 8))}
              className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3.5 text-center text-xl tracking-[0.45em] text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
              placeholder="••••••"
              required
            />
          </label>

          {isSetup && (
            <label className="block text-sm font-medium text-slate-200">
              Confirm PIN
              <input
                aria-label="Confirm PIN"
                autoComplete="off"
                inputMode="numeric"
                maxLength={8}
                pattern="[0-9]{4,8}"
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value.replace(/\D/g, '').slice(0, 8))}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3.5 text-center text-xl tracking-[0.45em] text-white outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20"
                placeholder="••••••"
                required
              />
            </label>
          )}

          {message && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-400/10 p-3 text-sm text-rose-100">{message}</p>}
          {!isSetup && lockRemaining > 0 && (
            <p className="text-center text-sm text-amber-200">Unlock attempts paused: {lockedSeconds}s remaining</p>
          )}

          <button
            type="submit"
            disabled={busy || (!isSetup && lockRemaining > 0)}
            className="w-full rounded-xl bg-emerald-500 px-4 py-3.5 font-bold text-[#061A13] transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Please wait…' : isSetup ? 'Save PIN & Continue' : 'Unlock Royal Pay'}
          </button>
        </form>
        <p className="mt-5 text-center text-xs leading-5 text-slate-400">Your PIN is never stored as plain text. Secure storage is protected by Android Keystore.</p>
      </section>
    </main>
  );
};
