import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { BarChart3, CalendarCheck, FileText, Users, WalletCards, Wifi, WifiOff, ArrowUpRight } from 'lucide-react';

const money = (amount: number) => `LKR ${Number(amount || 0).toLocaleString('en-LK', { maximumFractionDigits: 2 })}`;
const localDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const PremiumDashboardView: React.FC = () => {
  const { currentUser, factories, employees, attendance, payrollRuns, invoices, isOnline, pendingSyncCount, theme } = useApp();
  const dark = theme === 'dark';
  const assigned = new Set(currentUser.assignedFactoryIds || []);
  const supervisor = currentUser.role === 'supervisor';
  const visibleFactories = supervisor ? factories.filter(f => assigned.has(f.id)) : factories;
  const factoryIds = new Set(visibleFactories.map(f => f.id));
  const visibleEmployees = employees.filter(e => factoryIds.has(e.currentFactoryId));
  const visibleAttendance = attendance.filter(a => factoryIds.has(a.factoryId));
  const visiblePayroll = supervisor ? [] : payrollRuns;
  const visibleInvoices = supervisor ? [] : invoices;
  const today = localDateKey(new Date());
  const todayAttendance = visibleAttendance.filter(a => a.date === today);
  const present = todayAttendance.filter(a => a.status === 'present').length;
  const halfDay = todayAttendance.filter(a => a.status === 'half_day').length;
  const payrollTotal = visiblePayroll.filter(r => r.status !== 'draft').reduce((sum, r) => sum + (r.totalNet || 0), 0);
  const outstanding = visibleInvoices.filter(i => i.status !== 'cancelled').reduce((sum, i) => sum + (i.outstandingBalance || 0), 0);
  const factoryRows = useMemo(() => visibleFactories.map(factory => ({
    ...factory,
    workerCount: visibleEmployees.filter(e => e.currentFactoryId === factory.id && e.status === 'active').length,
    presentCount: todayAttendance.filter(a => a.factoryId === factory.id && a.status === 'present').length,
  })), [visibleFactories, visibleEmployees, todayAttendance]);
  const surface = dark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800';
  const muted = dark ? 'text-slate-400' : 'text-slate-500';
  const kpis = [
    { label: 'Active employees', value: String(visibleEmployees.filter(e => e.status === 'active').length), note: 'Authorized employee records', Icon: Users },
    { label: "Today's present", value: String(present), note: `${halfDay} half-day attendance record(s)`, Icon: CalendarCheck },
    { label: 'Approved payroll totals', value: supervisor ? 'Restricted' : money(payrollTotal), note: supervisor ? 'Not available for supervisor role' : 'Saved non-draft payroll runs', Icon: WalletCards },
    { label: 'Invoice outstanding', value: supervisor ? 'Restricted' : money(outstanding), note: supervisor ? 'Not available for supervisor role' : 'From existing invoice balances', Icon: FileText },
  ];
  return <div className={`min-h-full p-4 sm:p-6 lg:p-8 ${dark ? 'bg-slate-950' : 'bg-[#f3f6f2]'}`}>
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.22em] text-amber-700">Royal Hires / Operations</p><h2 className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight ${dark ? 'text-white' : 'text-[#0a3324]'}`}>Premium Dashboard</h2><p className={`mt-1 ${muted}`}>A live view of records available to your account.</p></div>
        <div className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${surface}`}>{isOnline ? <Wifi size={15} /> : <WifiOff size={15} />}{isOnline ? 'Device online' : 'Offline'}{pendingSyncCount > 0 && <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">{pendingSyncCount} pending</span>}</div>
      </div>
      <div className={`rounded-xl border p-3 text-sm ${dark ? 'border-amber-900 bg-amber-950/40 text-amber-100' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>Figures are read from the existing app context. Payroll uses saved runs, invoice figures use saved outstanding balances, and this screen does not create or edit records.</div>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{kpis.map(({label,value,note,Icon}) => <article key={label} className={`rounded-2xl border p-5 shadow-sm ${surface}`}><div className="flex items-center justify-between gap-3"><p className={`text-sm font-semibold ${muted}`}>{label}</p><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-900"><Icon size={19}/></span></div><p className={`mt-5 break-words text-2xl font-extrabold ${dark ? 'text-white' : 'text-[#0a3324]'}`}>{value}</p><p className={`mt-1 text-xs ${muted}`}>{note}</p></article>)}</section>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className={`rounded-2xl border p-5 shadow-sm lg:col-span-2 ${surface}`}><div className="flex items-center justify-between gap-3"><div><h3 className="font-bold">Factory overview</h3><p className={`mt-1 text-xs ${muted}`}>Only factories currently visible to your account</p></div><BarChart3 className="text-amber-600"/></div>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-sm"><thead className={muted}><tr><th className="py-3 pr-3 font-semibold">Factory</th><th className="py-3 pr-3 font-semibold">Active workers</th><th className="py-3 pr-3 font-semibold">Present today</th><th className="py-3 font-semibold">Status</th></tr></thead><tbody>{factoryRows.length ? factoryRows.map(f => <tr key={f.id} className={dark ? 'border-t border-slate-700' : 'border-t border-slate-100'}><td className="py-3 pr-3 font-semibold">{f.name}</td><td className="py-3 pr-3">{f.workerCount}</td><td className="py-3 pr-3">{f.presentCount}</td><td className="py-3"><span className={`rounded-full px-2 py-1 text-xs ${f.active ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-600'}`}>{f.active ? 'Active' : 'Inactive'}</span></td></tr>) : <tr><td colSpan={4} className={`py-8 text-center ${muted}`}>No authorized factory records available.</td></tr>}</tbody></table></div>
        </article>
        <article className={`rounded-2xl border p-5 shadow-sm ${surface}`}><h3 className="font-bold">Quick summary</h3><p className={`mt-1 text-xs ${muted}`}>Today · {today}</p><div className="mt-5 space-y-4">{[{label:'Attendance records',value:todayAttendance.length},{label:'Present',value:present},{label:'Absent',value:todayAttendance.filter(a=>a.status==='absent').length},{label:'Half day',value:halfDay},{label:'Factories visible',value:visibleFactories.length}].map(item=><div key={item.label} className="flex items-center justify-between gap-3"><span className={muted}>{item.label}</span><strong>{item.value}</strong></div>)}</div><div className={`mt-5 rounded-xl p-3 text-xs ${dark ? 'bg-slate-800' : 'bg-emerald-50 text-emerald-950'}`}><div className="flex items-center gap-2 font-semibold"><ArrowUpRight size={15}/>Existing records only</div><p className="mt-1">No demo amounts are generated. Empty or unavailable source data should be checked in the existing modules.</p></div></article>
      </section>
      <p className={`text-xs ${muted}`}>Royal Pay · Premium UI preview · Read-only dashboard · {currentUser.role === 'admin' ? 'Administrator' : currentUser.role === 'office_staff' ? 'Office staff' : 'Supervisor'} access</p>
    </div>
  </div>;
};
