import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowRight, Bell, CalendarCheck, ClipboardList, FileText, Users,
  WalletCards, Wifi, WifiOff, Clock3, Building2, Plus, ArrowUpRight,
} from 'lucide-react';

type DashboardTab = 'attendance' | 'employees' | 'payroll' | 'invoices' | 'reports';

const money = (amount: number) => `LKR ${Number(amount || 0).toLocaleString('en-LK', { maximumFractionDigits: 2 })}`;
const localDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const PremiumDashboardView: React.FC<{ onNavigate?: (tab: DashboardTab) => void }> = ({ onNavigate }) => {
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
  const surface = dark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-white bg-white text-[#153b2c]';
  const muted = dark ? 'text-slate-400' : 'text-[#75867c]';
  const kpis = [
    { label: 'ACTIVE WORKERS', value: String(visibleEmployees.filter(e => e.status === 'active').length), note: 'Across visible factories', Icon: Users, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'PRESENT TODAY', value: String(present), note: `${halfDay} half-day record(s)`, Icon: CalendarCheck, tone: 'bg-teal-50 text-teal-700' },
    { label: 'PAYROLL REVIEW', value: supervisor ? 'Restricted' : money(payrollTotal), note: supervisor ? 'Admin / office access only' : 'Saved non-draft pay runs', Icon: WalletCards, tone: 'bg-amber-50 text-amber-700' },
    { label: 'INVOICE BALANCE', value: supervisor ? 'Restricted' : money(outstanding), note: supervisor ? 'Admin / office access only' : 'Saved invoice balances', Icon: FileText, tone: 'bg-orange-50 text-orange-700' },
  ];
  const shortcuts: { title: string; subtitle: string; tab: DashboardTab; Icon: React.ElementType }[] = [
    { title: 'Mark attendance', subtitle: 'Record a shift', tab: 'attendance', Icon: CalendarCheck },
    { title: 'Manage employees', subtitle: 'View team records', tab: 'employees', Icon: Users },
    { title: 'Prepare payroll', subtitle: 'Review pay runs', tab: 'payroll', Icon: WalletCards },
  ];
  return <div className={`min-h-full px-4 py-5 sm:px-6 sm:py-7 lg:px-9 lg:py-8 ${dark ? 'bg-[#091810]' : 'bg-[#edf7f1]'}`}>
    <div className="mx-auto max-w-[1440px] space-y-5 sm:space-y-6">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-xs font-bold tracking-[.16em] ${dark ? 'text-emerald-300' : 'text-emerald-800'}`}>ROYAL HIRES · WORKSPACE</p>
          <h1 className={`mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl ${dark ? 'text-white' : 'text-[#123c2b]'}`}>Hi, {currentUser.name || 'there'} 👋</h1>
          <p className={`mt-1 text-sm ${muted}`}>Here’s your workforce at a glance.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div className={`hidden items-center gap-2 rounded-full border px-3 py-2 text-xs sm:flex ${surface}`}>
            {isOnline ? <Wifi size={15} className="text-emerald-600"/> : <WifiOff size={15} className="text-amber-600"/>}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
            {pendingSyncCount > 0 && <b className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">{pendingSyncCount}</b>}
          </div>
          <button type="button" aria-label="Connection status" className={`grid h-10 w-10 place-items-center rounded-full border shadow-sm sm:hidden ${surface}`} title={isOnline ? 'Online' : 'Offline'}>{isOnline ? <Wifi size={17}/> : <WifiOff size={17}/>}</button>
          <span className={`grid h-10 w-10 place-items-center rounded-full border shadow-sm ${surface}`} aria-label="Notifications"><Bell size={17}/></span>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#13a879] via-[#079767] to-[#087b55] p-5 text-white shadow-lg shadow-emerald-900/10 sm:p-7 lg:flex lg:items-center lg:justify-between lg:px-9 lg:py-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-52 w-52 rounded-full border-[28px] border-white/10"/>
        <div className="pointer-events-none absolute bottom-[-70px] right-[22%] h-40 w-40 rounded-full bg-white/5"/>
        <div className="relative z-10 max-w-2xl">
          <p className="text-[10px] font-extrabold tracking-[.2em] text-emerald-50/90">YOUR OPERATIONS, MADE CLEARER</p>
          <h2 className="mt-3 max-w-xl text-2xl font-extrabold leading-tight sm:text-3xl">Your people. Your numbers. One clear view.</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/90">Attendance, payroll and factory activity — all in one friendly workspace.</p>
          <button type="button" onClick={() => onNavigate?.('attendance')} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">View attendance <ArrowRight size={16}/></button>
        </div>
        <div className="relative z-10 mt-5 hidden w-44 shrink-0 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm lg:block">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15"><Building2 size={23}/></div>
          <p className="mt-4 text-2xl font-extrabold">{visibleFactories.length}</p><p className="mt-1 text-xs text-white/80">Visible factories</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/20"><div className="h-full w-3/4 rounded-full bg-white/90"/></div>
          <p className="mt-2 text-[10px] text-white/75">Authorized workspace</p>
        </div>
      </section>

      <section aria-label="Key metrics" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {kpis.map(({label,value,note,Icon,tone}) => <article key={label} className={`min-w-0 rounded-[20px] border p-4 shadow-sm shadow-emerald-950/[.03] sm:p-5 ${surface}`}>
          <div className="flex items-start justify-between gap-2"><p className={`text-[9px] font-extrabold leading-4 tracking-[.08em] sm:text-[10px] ${muted}`}>{label}</p><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone}`}><Icon size={17}/></span></div>
          <p className={`mt-4 break-words text-lg font-extrabold leading-tight sm:text-xl lg:text-2xl ${dark ? 'text-white' : 'text-[#123c2b]'}`}>{value}</p>
          <p className={`mt-2 text-[10px] leading-4 sm:text-xs ${muted}`}>{note}</p>
        </article>)}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_.9fr]">
        <article className={`rounded-[22px] border p-5 shadow-sm sm:p-6 ${surface}`}>
          <div className="flex items-start justify-between gap-3"><div><h3 className="text-base font-extrabold sm:text-lg">Factory overview</h3><p className={`mt-1 text-xs ${muted}`}>Only factories visible to your account</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Building2 size={19}/></span></div>
          <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[440px] text-left text-xs sm:text-sm"><thead className={muted}><tr><th className="py-3 pr-3 font-semibold">Factory</th><th className="py-3 pr-3 font-semibold">Workers</th><th className="py-3 pr-3 font-semibold">Present</th><th className="py-3 font-semibold">Status</th></tr></thead><tbody>{factoryRows.length ? factoryRows.map(f => <tr key={f.id} className={dark ? 'border-t border-slate-700' : 'border-t border-emerald-50'}><td className="py-3 pr-3 font-bold">{f.name}</td><td className="py-3 pr-3">{f.workerCount}</td><td className="py-3 pr-3">{f.presentCount}</td><td className="py-3"><span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${f.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{f.active ? 'Active' : 'Inactive'}</span></td></tr>) : <tr><td colSpan={4} className={`py-8 text-center ${muted}`}>No authorized factory records available.</td></tr>}</tbody></table></div>
        </article>
        <article className={`rounded-[22px] border p-5 shadow-sm sm:p-6 ${dark ? 'border-slate-700 bg-slate-900' : 'border-emerald-100 bg-[#dff3e8]'}`}>
          <h3 className={`text-base font-extrabold sm:text-lg ${dark ? 'text-white' : 'text-[#123c2b]'}`}>Quick actions</h3><p className={`mt-1 text-xs ${muted}`}>Your everyday tools, one tap away.</p>
          <div className="mt-4 space-y-2.5">{shortcuts.filter(item => !(supervisor && (item.tab === 'payroll'))).map(({title,subtitle,tab,Icon}) => <button key={tab} type="button" onClick={() => onNavigate?.(tab)} className={`group flex min-h-[62px] w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 ${dark ? 'border-slate-700 bg-slate-800 hover:bg-slate-750' : 'border-white bg-white hover:border-emerald-200'}`}>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Icon size={18}/></span><span className="min-w-0 flex-1"><span className={`block text-sm font-bold ${dark ? 'text-white' : 'text-[#153b2c]'}`}>{title}</span><span className={`mt-1 block text-xs ${muted}`}>{subtitle}</span></span><ArrowUpRight size={17} className="shrink-0 text-emerald-700 transition group-hover:translate-x-0.5"/>
          </button>)}</div>
        </article>
      </section>

      <section className={`rounded-[22px] border p-5 shadow-sm sm:p-6 ${surface}`}>
        <div className="flex items-center justify-between gap-3"><div><h3 className="text-base font-extrabold sm:text-lg">Factory activity</h3><p className={`mt-1 text-xs ${muted}`}>A quick snapshot of assigned locations</p></div><button type="button" onClick={() => onNavigate?.('reports')} className="inline-flex min-h-9 items-center gap-1 rounded-xl bg-emerald-50 px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100">View reports <ArrowRight size={14}/></button></div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{factoryRows.length ? factoryRows.map(f => <div key={f.id} className={`rounded-2xl p-4 ${dark ? 'bg-slate-800' : 'bg-[#f1f9f4]'}`}><div className="flex items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm"><Building2 size={18}/></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{f.name}</p><p className={`mt-1 text-xs ${muted}`}>{f.active ? 'Active factory' : 'Inactive factory'}</p></div></div><div className="mt-4 flex items-center justify-between gap-3"><div><p className={`text-[10px] ${muted}`}>Active workers</p><p className="mt-1 text-lg font-extrabold">{f.workerCount}</p></div><div className="text-right"><p className={`text-[10px] ${muted}`}>Present today</p><p className="mt-1 text-lg font-extrabold">{f.presentCount}</p></div></div></div>) : <p className={`py-6 text-sm ${muted}`}>No factory data is available for this account.</p>}</div>
      </section>
      <div className={`flex flex-wrap items-center justify-between gap-2 pb-2 text-[10px] ${muted}`}><span>Royal Hires Private Limited · Secure operations workspace</span><span className="inline-flex items-center gap-1.5">{isOnline ? <Wifi size={12}/> : <WifiOff size={12}/>} {isOnline ? 'Online' : 'Offline'}{pendingSyncCount > 0 ? ` · ${pendingSyncCount} pending sync` : ''}</span></div>
    </div>
  </div>;
};
