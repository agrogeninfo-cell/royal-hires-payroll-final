import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  CalendarCheck,
  Clock,
  Building2,
  Users,
  Home,
  Calculator,
  FileText,
  Receipt,
  BarChart3,
  History,
  ShieldCheck,
  Menu,
  Plus,
  PlayCircle,
  HardDriveDownload,
  Sparkles,
  Zap,
  UserCheck,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'attendance'
  | 'overtime'
  | 'factories'
  | 'employees'
  | 'boarding'
  | 'payroll'
  | 'invoices'
  | 'receipts'
  | 'reports'
  | 'audit'
  | 'profile';

interface NavigationTabsProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenBackupHub: () => void;
  onOpenTests: () => void;
  onQuickAction: () => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  setActiveTab,
  onOpenBackupHub,
  onOpenTests,
  onQuickAction,
}) => {
  const { currentUser, attendance, theme, t } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isSupervisor = currentUser.role === 'supervisor';
  const isDark = theme === 'dark';

  const pendingOtCount = attendance.filter(
    (a) => a.totalOtHours > 0 && a.submissionStatus === 'submitted'
  ).length;

  const allTabs: {
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    category: 'core' | 'operations' | 'finance' | 'system';
    badge?: number;
    adminOnly?: boolean;
    hideForSupervisor?: boolean;
  }[] = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard, category: 'core' },
    { id: 'attendance', label: t.nav.attendance, icon: CalendarCheck, category: 'core' },
    {
      id: 'overtime',
      label: t.nav.overtime,
      icon: Clock,
      category: 'operations',
      badge: pendingOtCount,
      adminOnly: true,
      hideForSupervisor: true,
    },
    { id: 'factories', label: t.nav.factories, icon: Building2, category: 'core', hideForSupervisor: true },
    { id: 'employees', label: t.nav.employees, icon: Users, category: 'operations', hideForSupervisor: true },
    { id: 'boarding', label: t.nav.boarding, icon: Home, category: 'operations', hideForSupervisor: true },
    { id: 'payroll', label: t.nav.payroll, icon: Calculator, category: 'core', hideForSupervisor: true },
    { id: 'invoices', label: t.nav.invoices, icon: FileText, category: 'finance', hideForSupervisor: true },
    { id: 'receipts', label: t.nav.receipts, icon: Receipt, category: 'finance', hideForSupervisor: true },
    { id: 'reports', label: t.nav.reports, icon: BarChart3, category: 'finance', hideForSupervisor: true },
    { id: 'audit', label: t.nav.audit, icon: History, category: 'system', hideForSupervisor: true },
    { id: 'profile', label: t.nav.profile, icon: UserCheck, category: 'system', hideForSupervisor: false },
  ];

  const visibleTabs = allTabs.filter((tab) => {
    if (isSupervisor && tab.hideForSupervisor) return false;
    return true;
  });

  const selectTab = (id: TabType) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Top Tabs Strip */}
      <nav
        className={`hidden sm:block sticky top-16 sm:top-18 z-30 transition-colors border-b ${
          isDark
            ? 'bg-[#0b1319]/90 backdrop-blur-md border-white/8 text-slate-300'
            : 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-600 shadow-2xl'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <div className="flex space-x-1.5 py-2.5 overflow-x-auto scrollbar-none">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => selectTab(tab.id)}
                  className={`flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold rounded-full whitespace-nowrap transition cursor-pointer relative ${
                    isActive
                      ? isDark
                        ? 'bg-[#00E5C9] text-slate-950 font-bold shadow-md shadow-[#00E5C9]/25'
                        : 'bg-emerald-600 text-white font-bold shadow-xs'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                        isActive
                          ? 'bg-slate-950 text-amber-300'
                          : 'bg-amber-400 text-slate-950'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2 py-2 shrink-0">
            <button
              onClick={onOpenTests}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition cursor-pointer ${
                isDark
                  ? 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5 text-indigo-400" />
              <span>Verify (20 Tests)</span>
            </button>
          </div>
        </div>
      </nav>

      {/* FLOATING MOBILE BOTTOM NAVIGATION DOCK (Look & feel of Reference Image 1 & 2) */}
      <div className="fixed bottom-3 sm:bottom-5 inset-x-0 mx-auto w-[calc(100%-24px)] max-w-md z-40 pointer-events-auto">
        <div
          className={`rounded-full px-3 py-2 flex items-center justify-around shadow-2xl transition-all ${
            isDark ? 'glass-dock text-white' : 'glass-dock-light text-slate-800'
          }`}
        >
          {/* 1: Home */}
          <button
            onClick={() => selectTab('dashboard')}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition cursor-pointer ${
              activeTab === 'dashboard'
                ? isDark
                  ? 'bg-[#00E5C9] text-slate-950 shadow-md shadow-[#00E5C9]/40 scale-105'
                  : 'bg-emerald-600 text-white shadow-md scale-105'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Dashboard"
          >
            <LayoutDashboard className="w-5 h-5" />
          </button>

          {/* 2: Attendance */}
          <button
            onClick={() => selectTab('attendance')}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition cursor-pointer relative ${
              activeTab === 'attendance'
                ? isDark
                  ? 'bg-[#00E5C9] text-slate-950 shadow-md shadow-[#00E5C9]/40 scale-105'
                  : 'bg-emerald-600 text-white shadow-md scale-105'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Mark Attendance"
          >
            <CalendarCheck className="w-5 h-5" />
          </button>

          {/* CENTER PROMINENT FAB: Quick Action Button (Image 1 '+' & Image 2 style) */}
          <button
            onClick={onQuickAction}
            className="w-12 h-12 -my-2 rounded-full btn-cyan-glow flex items-center justify-center text-slate-950 font-bold transition transform active:scale-90 hover:scale-105 cursor-pointer shadow-lg shrink-0"
            title="Quick Action"
          >
            <Zap className="w-6 h-6 fill-slate-950" />
          </button>

          {/* 3: Factories or OT (if not supervisor) */}
          {!isSupervisor ? (
            <button
              onClick={() => selectTab('factories')}
              className={`flex flex-col items-center justify-center p-2 rounded-full transition cursor-pointer ${
                activeTab === 'factories'
                  ? isDark
                    ? 'bg-[#00E5C9] text-slate-950 shadow-md shadow-[#00E5C9]/40 scale-105'
                    : 'bg-emerald-600 text-white shadow-md scale-105'
                  : isDark
                  ? 'text-slate-400 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Factories & Rates"
            >
              <Building2 className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9"></div>
          )}

          {/* 4: Menu / All Tools Sheet */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className={`flex flex-col items-center justify-center p-2 rounded-full transition cursor-pointer relative ${
              isMobileMenuOpen
                ? isDark
                  ? 'bg-[#00E5C9] text-slate-950 scale-105'
                  : 'bg-emerald-600 text-white scale-105'
                : isDark
                ? 'text-slate-400 hover:text-white'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="All Modules Menu"
          >
            <Menu className="w-5 h-5" />
            {pendingOtCount > 0 && !isSupervisor && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-[#0B1319]"></span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Up Full Navigation Sheet */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex flex-col justify-end animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className={`rounded-t-3xl p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4 animate-slideUp ${
              isDark ? 'bg-[#0E1720] border-t border-white/10 text-white' : 'bg-white text-slate-800'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00E5C9] to-emerald-600 flex items-center justify-center font-bold text-sm text-slate-950">
                  RH
                </div>
                <div>
                  <h3 className="font-bold text-sm text-inherit">Royal Hires (Pvt) Ltd</h3>
                  <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Active role: {t.roles[currentUser.role]}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer ${
                  isDark ? 'bg-white/10 text-slate-300' : 'bg-slate-100 text-slate-600'
                }`}
              >
                ✕
              </button>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenBackupHub();
                }}
                className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 transition cursor-pointer ${
                  isDark
                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-[#00E5C9]/30 text-emerald-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900'
                }`}
              >
                <ShieldCheck className="w-5 h-5 text-[#00E5C9] shrink-0" />
                <div>
                  <span className="text-xs font-bold block">Forever Backup</span>
                  <span className="text-[10px] opacity-75">Auto-Mirror Active</span>
                </div>
              </button>

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenTests();
                }}
                className={`p-3 rounded-2xl border text-left flex items-center space-x-2.5 transition cursor-pointer ${
                  isDark
                    ? 'bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 text-indigo-200'
                    : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-900'
                }`}
              >
                <PlayCircle className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <span className="text-xs font-bold block">20 System Tests</span>
                  <span className="text-[10px] opacity-75">Rule Verifications</span>
                </div>
              </button>
            </div>

            {/* All Modules Grid */}
            <div className="space-y-2 pt-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                System Modules &amp; Ledgers
              </span>
              <div className="grid grid-cols-2 gap-2">
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => selectTab(tab.id)}
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                        isActive
                          ? isDark
                            ? 'bg-[#00E5C9] text-slate-950 font-bold border-[#00E5C9] shadow-sm'
                            : 'bg-emerald-600 text-white font-bold border-emerald-600 shadow-sm'
                          : isDark
                          ? 'bg-white/5 hover:bg-white/10 border-white/8 text-slate-200'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-semibold truncate">{tab.label}</span>
                      </div>
                      {tab.badge !== undefined && tab.badge > 0 && (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-400 text-slate-950 shrink-0 ml-1">
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
