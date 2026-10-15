import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  CalendarCheck,
  Clock3,
  Building2,
  Users,
  Home,
  WalletCards,
  FileText,
  Receipt,
  BarChart3,
  History,
  ShieldCheck,
  Menu,
  Plus,
  PlayCircle,
  HardDriveDownload,
  UserRound,
  X,
  Sun,
  Moon,
  Wifi,
  WifiOff,
  RefreshCw,
  Settings,
  ChevronRight,
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
  const {
    currentUser,
    allUsers,
    setCurrentUser,
    attendance,
    theme,
    setTheme,
    t,
    isOnline,
    toggleOnlineStatus,
    pendingSyncCount,
    syncOfflineQueue,
  } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isDark = theme === 'dark';
  const isSupervisor = currentUser.role === 'supervisor';

  const pendingOtCount = attendance.filter((record) => record.totalOtHours > 0 && record.submissionStatus === 'submitted').length;

  const allTabs: Array<{
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    category: 'core' | 'operations' | 'finance' | 'system';
    badge?: number;
    hideForSupervisor?: boolean;
  }> = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard, category: 'core' },
    { id: 'attendance', label: t.nav.attendance, icon: CalendarCheck, category: 'core' },
    { id: 'overtime', label: t.nav.overtime, icon: Clock3, category: 'operations', badge: pendingOtCount, hideForSupervisor: true },
    { id: 'factories', label: t.nav.factories, icon: Building2, category: 'core', hideForSupervisor: true },
    { id: 'employees', label: t.nav.employees, icon: Users, category: 'operations', hideForSupervisor: true },
    { id: 'boarding', label: t.nav.boarding, icon: Home, category: 'operations', hideForSupervisor: true },
    { id: 'payroll', label: t.nav.payroll, icon: WalletCards, category: 'core', hideForSupervisor: true },
    { id: 'invoices', label: t.nav.invoices, icon: FileText, category: 'finance', hideForSupervisor: true },
    { id: 'receipts', label: t.nav.receipts, icon: Receipt, category: 'finance', hideForSupervisor: true },
    { id: 'reports', label: t.nav.reports, icon: BarChart3, category: 'finance', hideForSupervisor: true },
    { id: 'audit', label: t.nav.audit, icon: History, category: 'system', hideForSupervisor: true },
    { id: 'profile', label: t.nav.profile, icon: UserRound, category: 'system' },
  ];

  const visibleTabs = allTabs.filter((tab) => !(isSupervisor && tab.hideForSupervisor));
  const preferredMobileIds: TabType[] = isSupervisor
    ? ['dashboard', 'attendance', 'profile']
    : ['dashboard', 'employees', 'attendance', 'payroll'];
  const mobileTabs = preferredMobileIds.map((id) => visibleTabs.find((tab) => tab.id === id)).filter((tab): tab is (typeof visibleTabs)[number] => Boolean(tab));

  const selectTab = (id: TabType) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav className="rh-desktop-nav" aria-label="Main navigation">
        <div className="rh-desktop-nav-inner">
          <div className="rh-desktop-nav-tabs">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => selectTab(tab.id)} className={activeTab === tab.id ? 'rh-desktop-tab active' : 'rh-desktop-tab'}>
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && <span className="rh-nav-badge">{tab.badge}</span>}
                </button>
              );
            })}
          </div>
          <button className="rh-verify-button" onClick={onOpenTests}><PlayCircle size={15} /> System checks</button>
        </div>
      </nav>

      <nav className="rh-mobile-nav" aria-label="Primary navigation">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} className={activeTab === tab.id ? 'rh-mobile-nav-item active' : 'rh-mobile-nav-item'} onClick={() => selectTab(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined}>
              <span className="rh-mobile-nav-icon"><Icon size={19} /></span>
              <span>{tab.id === 'dashboard' ? 'Home' : tab.id === 'profile' ? 'Profile' : tab.label}</span>
            </button>
          );
        })}
        <button className={isMobileMenuOpen ? 'rh-mobile-nav-item active' : 'rh-mobile-nav-item'} onClick={() => setIsMobileMenuOpen(true)} aria-label="More modules">
          <span className="rh-mobile-nav-icon"><Menu size={19} /><span className="rh-more-dot" /></span>
          <span>More</span>
        </button>
      </nav>

      {isMobileMenuOpen && (
        <div className="rh-menu-backdrop" onClick={() => setIsMobileMenuOpen(false)}>
          <section className="rh-menu-sheet" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="More modules and settings">
            <div className="rh-sheet-handle" />
            <div className="rh-sheet-heading">
              <div className="rh-sheet-brand"><span className="rh-sheet-logo">RH</span><div><strong>More tools</strong><small>{currentUser.name} · {currentUser.role === 'admin' ? 'Administrator' : currentUser.role === 'office_staff' ? 'Office staff' : 'Supervisor'}</small></div></div>
              <button className="rh-sheet-close" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu"><X size={19} /></button>
            </div>

            <div className="rh-sheet-actions">
              <button onClick={() => { setIsMobileMenuOpen(false); onQuickAction(); }}><span className="sheet-action-icon quick"><Plus size={17} /></span><span><strong>Quick action</strong><small>Common tasks</small></span><ChevronRight size={16} /></button>
              <button onClick={() => { setIsMobileMenuOpen(false); onOpenBackupHub(); }}><span className="sheet-action-icon backup"><ShieldCheck size={17} /></span><span><strong>Backup centre</strong><small>Protect app records</small></span><ChevronRight size={16} /></button>
              <button onClick={() => { setIsMobileMenuOpen(false); onOpenTests(); }}><span className="sheet-action-icon tests"><PlayCircle size={17} /></span><span><strong>System checks</strong><small>Business rule tests</small></span><ChevronRight size={16} /></button>
            </div>

            <h3 className="rh-sheet-section-title">All modules</h3>
            <div className="rh-sheet-module-grid">
              {visibleTabs.filter((tab) => !preferredMobileIds.includes(tab.id)).map((tab) => {
                const Icon = tab.icon;
                return (
                  <button key={tab.id} className={activeTab === tab.id ? 'rh-sheet-module active' : 'rh-sheet-module'} onClick={() => selectTab(tab.id)}>
                    <Icon size={18} /><span>{tab.label}</span>{tab.badge !== undefined && tab.badge > 0 && <b>{tab.badge}</b>}
                  </button>
                );
              })}
            </div>

            <h3 className="rh-sheet-section-title">App preferences</h3>
            <div className="rh-preferences-list">
              <button onClick={() => setTheme(isDark ? 'light' : 'dark')}><span className="rh-preference-icon">{isDark ? <Sun size={17} /> : <Moon size={17} />}</span><span><strong>{isDark ? 'Light appearance' : 'Dark appearance'}</strong><small>Change app colours</small></span><span className="rh-preference-value">{isDark ? 'Dark' : 'Light'}</span></button>
              <button onClick={toggleOnlineStatus}><span className="rh-preference-icon">{isOnline ? <Wifi size={17} /> : <WifiOff size={17} />}</span><span><strong>Network status</strong><small>Automatically follows device connectivity</small></span><span className="rh-preference-value">{isOnline ? 'Online' : 'Offline'}</span></button>
              <button onClick={() => void syncOfflineQueue()} disabled={!isOnline || pendingSyncCount === 0}><span className="rh-preference-icon"><RefreshCw size={17} /></span><span><strong>Sync pending changes</strong><small>{pendingSyncCount} item(s) waiting</small></span><span className="rh-preference-value">{!isOnline ? 'Offline' : pendingSyncCount ? 'Sync' : 'Up to date'}</span></button>
              <label className="rh-role-row"><span className="rh-preference-icon"><UserRound size={17} /></span><span><strong>Active demo role</strong><small>Preview the interface as another role</small></span><select value={currentUser.id} onChange={(event) => { const user = allUsers.find((item) => item.id === event.target.value); if (user) setCurrentUser(user); }} aria-label="Active user role">{allUsers.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.role === 'admin' ? 'Admin' : user.role === 'office_staff' ? 'Office' : 'Supervisor'}</option>)}</select></label>
            </div>
            <div className="rh-sheet-footer">Royal Hires Payroll Management <span>·</span> Offline-ready workspace</div>
          </section>
        </div>
      )}
    </>
  );
};
