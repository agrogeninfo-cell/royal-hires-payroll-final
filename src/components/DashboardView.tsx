import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Building2,
  CalendarCheck,
  Clock,
  TrendingUp,
  Receipt,
  FileText,
  AlertCircle,
  CheckCircle2,
  WifiOff,
  ArrowRight,
  ShieldCheck,
  Plus,
  HardDriveDownload,
  Database,
  Lock,
  Sparkles,
  Zap,
  MapPin,
  ChevronRight,
  Shield,
  Layers,
  Smartphone,
} from 'lucide-react';
import { TabType } from './NavigationTabs';
import { getProfilePhoto, subscribeToPhotoUpdates } from '../utils/profilePhotoHelper';

interface DashboardViewProps {
  setActiveTab: (tab: TabType) => void;
  onOpenTests: () => void;
  onOpenBackupHub: () => void;
  onOpenInstall?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onOpenTests,
  onOpenBackupHub,
  onOpenInstall,
}) => {
  const {
    currentUser,
    factories,
    employees,
    attendance,
    invoices,
    receipts,
    payrollRuns,
    pendingSyncCount,
    isOnline,
    lastBackupTime,
    downloadForeverBackup,
    theme,
    t,
  } = useApp();

  const isDark = theme === 'dark';
  const isSupervisor = currentUser.role === 'supervisor';
  const assignedFactoryIds = currentUser.assignedFactoryIds || [];

  const accessibleFactories = isSupervisor
    ? factories.filter((f) => assignedFactoryIds.includes(f.id))
    : factories;

  const accessibleEmployees = isSupervisor
    ? employees.filter((e) => assignedFactoryIds.includes(e.currentFactoryId))
    : employees;

  const [activeFactoryFilter, setActiveFactoryFilter] = useState<string>('all');
  const [mdPhoto, setMdPhoto] = useState<string>(getProfilePhoto());

  React.useEffect(() => {
    const unsub = subscribeToPhotoUpdates((photo) => {
      setMdPhoto(photo);
    });
    return unsub;
  }, []);

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendance.filter((a) => {
    if (a.date !== today) return false;
    if (isSupervisor && !assignedFactoryIds.includes(a.factoryId)) return false;
    if (activeFactoryFilter !== 'all' && a.factoryId !== activeFactoryFilter) return false;
    return true;
  });

  const pendingOtApprovals = attendance.filter(
    (a) => a.totalOtHours > 0 && a.submissionStatus === 'submitted'
  );

  // Financial aggregates
  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalCollected = receipts.reduce((sum, rec) => sum + (rec.amount || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (inv.outstandingBalance || 0), 0);
  const totalPayrollOutlay = payrollRuns.reduce((sum, p) => sum + (p.totalNet || 0), 0);

  const displayedFactories =
    activeFactoryFilter === 'all'
      ? accessibleFactories
      : accessibleFactories.filter((f) => f.id === activeFactoryFilter);

  const totalAllRecords =
    factories.length +
    employees.length +
    attendance.length +
    payrollRuns.length +
    invoices.length +
    receipts.length;

  return (
    <div className="space-y-5 pb-24 sm:pb-16 max-w-5xl mx-auto w-full max-w-full overflow-hidden">
      {/* 1. HERO OPERATIONS CARD (With Cinematic Manpower Workforce Photography) */}
      <div className="rounded-3xl p-5 sm:p-7 relative overflow-hidden transition-all shadow-2xl border border-white/10 bg-[#090F15] text-white">
        {/* Cinematic Manpower Hero Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/src/assets/images/manpower_hero_1791703343665.jpg"
            alt="Cinematic Manpower Workforce"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center filter brightness-[0.40] contrast-[1.18] saturate-[1.1] scale-100"
          />
          {/* Cinematic dark gradients for crystal-clear readability and rich mood */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#090F15]/95 via-[#090F15]/85 to-[#090F15]/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#090F15]/90 via-transparent to-black/40" />
        </div>

        {/* Subtle glowing ambient background orbs */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[#00E5C9]/15 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-3 max-w-xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border bg-[#00E5C9]/20 text-[#00E5C9] border-[#00E5C9]/35 shadow-xs">
                Factory Manpower Pulse
              </span>
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-md text-slate-200 border border-white/10">
                Fixed Job: Helper Only
              </span>
              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Workforce Active</span>
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight text-white drop-shadow-sm">
                Workforce Deployment Hub
              </h1>
              <p className="text-xs sm:text-sm mt-1.5 leading-relaxed text-slate-200/90 drop-shadow-xs">
                Supplying industrial helpers to Kelani Textiles, Biyagama Packaging &amp; Katunayake Garments with independent factory billing cards.
              </p>
            </div>

            {/* 3 Circular Feature Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-2xl border bg-black/40 backdrop-blur-md border-white/15 text-slate-100 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-emerald-500/25 text-[#00E5C9] flex items-center justify-center font-bold text-[10px]">
                  ✓
                </div>
                <span className="font-semibold text-[11px]">All Helpers</span>
              </div>

              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-2xl border bg-black/40 backdrop-blur-md border-white/15 text-slate-100 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-blue-500/25 text-blue-300 flex items-center justify-center font-bold text-[10px]">
                  ⚡
                </div>
                <span className="font-semibold text-[11px]">Independent Rates</span>
              </div>

              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-2xl border bg-black/40 backdrop-blur-md border-white/15 text-slate-100 shadow-sm">
                <div className="w-6 h-6 rounded-full bg-teal-500/25 text-[#00E5C9] flex items-center justify-center font-bold text-[10px]">
                  🛡️
                </div>
                <span className="font-semibold text-[11px]">Dual-Layer Safe</span>
              </div>
            </div>
          </div>

          {/* Primary Action Button with Circular Arrow */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('attendance')}
              className="w-full sm:w-auto px-5 py-3 rounded-full btn-cyan-glow font-bold text-xs sm:text-sm flex items-center justify-between space-x-4 cursor-pointer transition transform active:scale-95 shadow-xl group text-slate-950"
            >
              <span>{t.attendance.markAttendance}</span>
              <span className="w-7 h-7 rounded-full bg-slate-950/20 flex items-center justify-center group-hover:translate-x-0.5 transition">
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </span>
            </button>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={onOpenBackupHub}
                className="w-full sm:w-auto px-4 py-2.5 rounded-full border border-white/20 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white text-xs font-semibold flex items-center justify-center space-x-2 transition cursor-pointer shadow-md"
              >
                <ShieldCheck className="w-4 h-4 text-[#00E5C9]" />
                <span>Forever Backup Hub</span>
              </button>

              {onOpenInstall && (
                <button
                  onClick={onOpenInstall}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-full border border-[#00E5C9]/35 bg-emerald-500/20 hover:bg-emerald-500/30 backdrop-blur-md text-[#00E5C9] text-xs font-bold flex items-center justify-center space-x-1.5 transition cursor-pointer shadow-md"
                  title="Install Android App / APK"
                >
                  <Smartphone className="w-4 h-4 text-[#00E5C9]" />
                  <span>Install App / APK</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. HORIZONTAL FACTORY CHIP FILTER (Matching Image 2 'Discover The Depths' pill category selection) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Assigned Workplaces
          </span>
          <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {accessibleFactories.length} Factories Active
          </span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none pb-1">
          <button
            onClick={() => setActiveFactoryFilter('all')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeFactoryFilter === 'all'
                ? isDark
                  ? 'bg-[#00E5C9] text-slate-950 shadow-md shadow-[#00E5C9]/30'
                  : 'bg-emerald-600 text-white shadow-xs'
                : isDark
                ? 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/8'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
          >
            All Factories
          </button>

          {accessibleFactories.map((fac) => (
            <button
              key={fac.id}
              onClick={() => setActiveFactoryFilter(fac.id)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                activeFactoryFilter === fac.id
                  ? isDark
                    ? 'bg-[#00E5C9] text-slate-950 font-bold shadow-md shadow-[#00E5C9]/30'
                    : 'bg-emerald-600 text-white font-bold shadow-xs'
                  : isDark
                  ? 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/8'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              {fac.name.split(' ')[0]} ({fac.code})
            </button>
          ))}
        </div>
      </div>

      {/* 3. CORE METRICS KPI GRID (Styled with rounded-2xl glass surfaces) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Active Helpers */}
        <div
          onClick={() => !isSupervisor && setActiveTab('employees')}
          className={`p-4 rounded-3xl border transition shadow-xs cursor-pointer ${
            isDark
              ? 'glass-card-dark hover:border-[#00E5C9]/40'
              : 'glass-card-light hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Active Helpers
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-[#00E5C9] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">
            {accessibleEmployees.length}
          </h3>
          <span
            className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isDark ? 'bg-white/5 text-[#00E5C9]' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            Fixed: Helper Only
          </span>
        </div>

        {/* Today's Present */}
        <div
          onClick={() => setActiveTab('attendance')}
          className={`p-4 rounded-3xl border transition shadow-xs cursor-pointer ${
            isDark
              ? 'glass-card-dark hover:border-[#00E5C9]/40'
              : 'glass-card-light hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Today's Present
            </span>
            <div className="w-8 h-8 rounded-full bg-teal-500/15 text-teal-400 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">
            {todayAttendance.filter((a) => a.status === 'present').length}
            <span className={`text-xs font-normal ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              / {accessibleEmployees.length}
            </span>
          </h3>
          <span
            className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isDark ? 'bg-white/5 text-slate-300' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {today}
          </span>
        </div>

        {/* OT Approvals */}
        <div
          onClick={() => !isSupervisor && setActiveTab('overtime')}
          className={`p-4 rounded-3xl border transition shadow-xs cursor-pointer ${
            isDark
              ? 'glass-card-dark hover:border-amber-400/40'
              : 'glass-card-light hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              OT Approvals
            </span>
            <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">
            {pendingOtApprovals.length}
          </h3>
          <span
            className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              pendingOtApprovals.length > 0
                ? 'bg-amber-500/20 text-amber-300'
                : isDark
                ? 'bg-white/5 text-slate-400'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {pendingOtApprovals.length > 0 ? 'Awaiting Admin' : 'All Clear'}
          </span>
        </div>

        {/* Invoiced or Sync */}
        <div
          onClick={onOpenBackupHub}
          className={`p-4 rounded-3xl border transition shadow-xs cursor-pointer ${
            isDark
              ? 'glass-card-dark hover:border-[#00E5C9]/40'
              : 'glass-card-light hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Forever Storage
            </span>
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-[#00E5C9] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight text-[#00E5C9]">
            {totalAllRecords}
          </h3>
          <span
            className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isDark ? 'bg-emerald-500/10 text-[#00E5C9]' : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            100% Synced
          </span>
        </div>
      </div>

      {/* 4. FINANCIAL SUMMARY CARDS (Admin & Office Staff) */}
      {!isSupervisor && (
        <div
          className={`rounded-3xl p-5 border shadow-sm transition ${
            isDark ? 'glass-card-dark border-white/10' : 'glass-card-light border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <h3 className="text-sm font-bold text-inherit">Financial Ledger &amp; Cash Flow</h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Invoices issued, collections received, and helper payroll liability
              </p>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-semibold text-[#00E5C9] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Full P&amp;L</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-white/4 border-white/6' : 'bg-slate-50 border-slate-100'}`}>
              <span className={`text-[11px] block font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Invoiced Revenue
              </span>
              <p className="text-base sm:text-lg font-bold mt-1">LKR {totalInvoiced.toLocaleString()}</p>
              <span className="text-[10px] text-slate-400 block mt-0.5">Total factory billings</span>
            </div>

            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-emerald-500/8 border-emerald-500/20' : 'bg-emerald-50 border-emerald-100'}`}>
              <span className="text-[11px] text-emerald-400 block font-medium">
                Collected Receipts
              </span>
              <p className="text-base sm:text-lg font-bold text-emerald-400 mt-1">
                LKR {totalCollected.toLocaleString()}
              </p>
              <span className="text-[10px] text-emerald-500/80 block mt-0.5">Received in bank / cash</span>
            </div>

            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-rose-500/8 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}>
              <span className="text-[11px] text-rose-400 block font-medium">
                Factory Outstanding
              </span>
              <p className="text-base sm:text-lg font-bold text-rose-400 mt-1">
                LKR {totalOutstanding.toLocaleString()}
              </p>
              <span className="text-[10px] text-rose-500/80 block mt-0.5">Unpaid by clients</span>
            </div>

            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-blue-500/8 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
              <span className="text-[11px] text-blue-400 block font-medium">
                Payroll Outlay
              </span>
              <p className="text-base sm:text-lg font-bold text-blue-400 mt-1">
                LKR {totalPayrollOutlay.toLocaleString()}
              </p>
              <span className="text-[10px] text-blue-500/80 block mt-0.5">Net helper payouts</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. FACTORY CARDS LIST (Matching Image 2 destination cards with price badges & Image 1 module cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-sm font-bold text-inherit">Workplace Rate Cards</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Method A (Same Rate For All) vs Method B (Separate Male / Female)
            </p>
          </div>
          {!isSupervisor && (
            <button
              onClick={() => setActiveTab('factories')}
              className="text-xs font-semibold text-[#00E5C9] hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <span>Manage Rates</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayedFactories.map((fac) => {
            const facEmployees = employees.filter((e) => e.currentFactoryId === fac.id);

            return (
              <div
                key={fac.id}
                className={`rounded-3xl p-5 border transition flex flex-col justify-between shadow-xs ${
                  isDark
                    ? 'glass-card-dark border-white/8 hover:border-[#00E5C9]/40'
                    : 'glass-card-light border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        isDark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {fac.code}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        fac.billingMethod === 'SAME_RATE_FOR_ALL'
                          ? isDark
                            ? 'bg-[#00E5C9]/15 text-[#00E5C9] border border-[#00E5C9]/30'
                            : 'bg-emerald-100 text-emerald-800'
                          : isDark
                          ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {fac.billingMethod === 'SAME_RATE_FOR_ALL' ? 'Method A: Same Rate' : 'Method B: Male/Female'}
                    </span>
                  </div>

                  <h4 className="font-bold text-base mt-2.5 text-inherit">{fac.name}</h4>
                  <p className={`text-xs flex items-center space-x-1 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{fac.address}</span>
                  </p>

                  {/* Price Specs Card (Like Image 2 price badge) */}
                  <div
                    className={`mt-3.5 p-3.5 rounded-2xl border space-y-1.5 ${
                      isDark ? 'bg-black/25 border-white/6' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    {fac.billingMethod === 'SAME_RATE_FOR_ALL' ? (
                      <div className="flex justify-between items-center text-xs">
                        <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                          Standard Helper Rate:
                        </span>
                        <strong className="text-sm font-bold text-[#00E5C9]">
                          LKR {fac.sameRate?.toLocaleString()} / day
                        </strong>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center text-xs">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Male Helper:</span>
                          <strong className="text-xs font-bold text-blue-400">
                            LKR {fac.maleRate?.toLocaleString()} / day
                          </strong>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Female Helper:</span>
                          <strong className="text-xs font-bold text-purple-400">
                            LKR {fac.femaleRate?.toLocaleString()} / day
                          </strong>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-white/6">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>OT Billing / Pay:</span>
                      <span className="font-semibold text-inherit">
                        LKR {fac.factoryOvertimeRateHourly} / LKR {fac.employeeOvertimeRateHourly} hr
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/6 flex items-center justify-between text-xs">
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                    Helpers: <strong className="text-inherit">{facEmployees.length}</strong>
                  </span>

                  <button
                    onClick={() => setActiveTab('attendance')}
                    className="text-xs font-bold text-[#00E5C9] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Mark Shift</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. MANAGING DIRECTOR & DEVELOPER SPOTLIGHT BANNER */}
      <div
        className={`rounded-3xl p-5 sm:p-6 border transition-all shadow-md relative overflow-hidden ${
          isDark
            ? 'bg-gradient-to-r from-[#0d1824] via-[#09121a] to-[#0a1f24] border-white/10 text-white'
            : 'bg-gradient-to-r from-slate-50 via-white to-emerald-50/50 border-slate-200 text-slate-800'
        }`}
      >
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4 text-center sm:text-left">
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-[#00E5C9] via-emerald-500 to-blue-600 shadow-md">
                <img
                  src={mdPhoto}
                  alt="Thusith Dissanayake"
                  referrerPolicy="no-referrer"
                  className="w-full h-full rounded-full object-cover object-top"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full"></span>
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                <h4 className="font-extrabold text-base tracking-tight">Thusith Dissanayake</h4>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/25">
                  MD
                </span>
              </div>
              <p className="text-xs font-semibold text-emerald-500 dark:text-[#00E5C9]">
                Managing Director — Royal Hires (Pvt) Ltd
              </p>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                App Developer &amp; System Designer • Manpower Payroll Management System
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 rounded-full text-xs font-bold border transition cursor-pointer flex items-center space-x-2 shrink-0 ${
              isDark
                ? 'bg-[#00E5C9]/15 hover:bg-[#00E5C9]/25 text-[#00E5C9] border-[#00E5C9]/35 shadow-xs'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
            }`}
          >
            <span>View Full Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
