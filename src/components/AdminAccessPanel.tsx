import React, { useCallback, useEffect, useState } from 'react';
import { Check, Clock, MailPlus, RefreshCw, ShieldCheck, UserRound, X } from 'lucide-react';
import { getSupabaseClient, sendAdminAccessAction } from '../services/authService';
import { useApp } from '../context/AppContext';

interface AdminAccessPanelProps { isOpen: boolean; onClose: () => void; }
interface PendingRequest { user_id: string; full_name: string; role: string; approval_requested_at: string; email: string; }
interface CloudFactory { id: string; name: string; code: string | null; }

export const AdminAccessPanel: React.FC<AdminAccessPanelProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useApp();
  const [pending, setPending] = useState<PendingRequest[]>([]);
  const [factories, setFactories] = useState<CloudFactory[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'office_staff' | 'supervisor'>('office_staff');
  const [factoryIds, setFactoryIds] = useState<string[]>([]);
  const [pendingRoles, setPendingRoles] = useState<Record<string, 'office_staff' | 'supervisor'>>({});
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    setErrorMessage('');
    try {
      const result = await sendAdminAccessAction<{ pending: PendingRequest[] }>({ action: 'list-pending' });
      setPending(result.pending || []);
      const { data, error } = await getSupabaseClient().from('factories').select('id,name,code').order('name');
      if (error) throw error;
      setFactories(data || []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not load access requests.');
    }
  }, []);

  useEffect(() => {
    if (isOpen && currentUser.role === 'admin') void refresh();
  }, [isOpen, currentUser.role, refresh]);

  if (!isOpen || currentUser.role !== 'admin') return null;

  const toggleFactory = (id: string) => setFactoryIds((old) => old.includes(id) ? old.filter((item) => item !== id) : [...old, id]);

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setErrorMessage('');
    setNotice('');
    try {
      await sendAdminAccessAction({ action: 'invite', email, fullName, role, factoryIds: role === 'supervisor' ? factoryIds : [] });
      setNotice('Invitation sent to ' + email.trim() + '.');
      setFullName('');
      setEmail('');
      await refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Invitation failed.');
    } finally {
      setBusy(false);
    }
  };

  const decide = async (request: PendingRequest, action: 'approve' | 'reject') => {
    setBusy(true);
    setErrorMessage('');
    setNotice('');
    try {
      if (action === 'approve') {
        const approvedRole = pendingRoles[request.user_id] || 'supervisor';
        await sendAdminAccessAction({ action, userId: request.user_id, role: approvedRole, factoryIds: approvedRole === 'supervisor' ? factoryIds : [] });
        setNotice((request.email || request.full_name) + ' approved as ' + (approvedRole === 'office_staff' ? 'Office Staff' : 'Supervisor') + '.');
      } else {
        await sendAdminAccessAction({ action, userId: request.user_id });
        setNotice('Access request for ' + (request.email || request.full_name) + ' rejected.');
      }
      await refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not update access request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-labelledby="access-panel-title">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#0b211a] p-5 text-white shadow-2xl sm:rounded-3xl sm:p-7">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-200"><ShieldCheck size={23} /></div>
            <h2 id="access-panel-title" className="text-2xl font-bold">User access management</h2>
            <p className="mt-1 text-sm text-slate-300">Invite staff and review new account requests.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-300 hover:bg-white/10" aria-label="Close access management"><X size={20} /></button>
        </header>

        {errorMessage && <p role="alert" className="mb-4 rounded-xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm text-rose-100">{errorMessage}</p>}
        {notice && <p role="status" className="mb-4 rounded-xl border border-emerald-300/20 bg-emerald-300/10 p-3 text-sm text-emerald-100">{notice}</p>}

        <form onSubmit={(event) => void invite(event)} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <div className="flex items-center gap-2 font-semibold"><MailPlus size={18} className="text-emerald-200" />Invite a staff member</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-200">Full name
              <input required maxLength={120} value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none focus:border-emerald-400" />
            </label>
            <label className="text-sm text-slate-200">Email
              <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-white outline-none focus:border-emerald-400" />
            </label>
          </div>
          <label className="block text-sm text-slate-200">Role
            <select value={role} onChange={(event) => setRole(event.target.value as 'office_staff' | 'supervisor')} className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#102d23] px-3 py-2.5 text-white outline-none focus:border-emerald-400">
              <option value="office_staff">Office Staff</option>
              <option value="supervisor">Factory Supervisor</option>
            </select>
          </label>
          {role === 'supervisor' && <div className="space-y-2">
            <p className="text-sm font-medium text-slate-200">Factory access</p>
            {factories.length === 0
              ? <p className="rounded-xl border border-amber-300/20 bg-amber-300/5 p-3 text-xs leading-5 text-amber-100">No cloud factories are available yet. This supervisor will have no factory-scoped data access until an administrator assigns factories.</p>
              : factories.map((factory) => <label key={factory.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-white/5"><input type="checkbox" checked={factoryIds.includes(factory.id)} onChange={() => toggleFactory(factory.id)} className="accent-emerald-500" /><span>{factory.name}{factory.code ? ' · ' + factory.code : ''}</span></label>)}
          </div>}
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold hover:bg-emerald-500 disabled:opacity-60"><MailPlus size={17} />{busy ? 'Processing…' : 'Send invitation'}</button>
        </form>

        <div className="mt-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="font-semibold">Pending requests <span className="ml-1 rounded-full bg-amber-300/10 px-2 py-0.5 text-xs text-amber-100">{pending.length}</span></h3>
            <button onClick={() => void refresh()} disabled={busy} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-slate-300 hover:bg-white/10"><RefreshCw size={14} />Refresh</button>
          </div>
          {pending.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-400"><Check size={18} className="mx-auto mb-2 text-emerald-300" />No pending access requests.</div> : <div className="space-y-3">{pending.map((request) => <article key={request.user_id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-slate-300"><UserRound size={18} /></div><div className="min-w-0 flex-1"><p className="font-semibold">{request.full_name || 'New user'}</p><p className="break-all text-sm text-slate-300">{request.email || request.user_id}</p><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><Clock size={12} />{request.approval_requested_at ? new Date(request.approval_requested_at).toLocaleString() : 'Recently requested'}</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]"><select aria-label={'Role for ' + (request.email || request.full_name)} value={pendingRoles[request.user_id] || 'supervisor'} onChange={(event) => setPendingRoles((old) => ({ ...old, [request.user_id]: event.target.value as 'office_staff' | 'supervisor' }))} className="rounded-xl border border-white/10 bg-[#102d23] px-3 py-2.5 text-sm text-white"><option value="office_staff">Office Staff</option><option value="supervisor">Factory Supervisor</option></select><button disabled={busy} onClick={() => void decide(request, 'approve')} className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50"><Check size={15} />Approve</button><button disabled={busy} onClick={() => void decide(request, 'reject')} className="flex items-center justify-center gap-1.5 rounded-xl border border-rose-300/20 px-3 py-2.5 text-sm font-semibold text-rose-200 hover:bg-rose-300/10 disabled:opacity-50"><X size={15} />Reject</button></div></article>)}</div>}
        </div>
      </section>
    </div>
  );
};
