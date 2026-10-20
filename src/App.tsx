import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthGate } from './components/AuthGate';
import { AdminAccessPanel } from './components/AdminAccessPanel';
import { Navbar } from './components/Navbar';
import { NavigationTabs, TabType } from './components/NavigationTabs';
import { DashboardView } from './components/DashboardView';
import { PremiumDashboardView } from './components/PremiumDashboardView';
import { AttendanceView } from './components/AttendanceView';
import { OvertimeApprovalView } from './components/OvertimeApprovalView';
import { FactoriesView } from './components/FactoriesView';
import { EmployeesView } from './components/EmployeesView';
import { BoardingView } from './components/BoardingView';
import { PayrollView } from './components/PayrollView';
import { InvoicesView } from './components/InvoicesView';
import { ReceiptsView } from './components/ReceiptsView';
import { ReportsView } from './components/ReportsView';
import { AuditView } from './components/AuditView';
import { ProfileView } from './components/ProfileView';
import { TestSuiteModal } from './components/TestSuiteModal';
import { BackupHubModal } from './components/BackupHubModal';
import { QuickActionModal } from './components/QuickActionModal';
import { InstallAppModal } from './components/InstallAppModal';
import { Wifi, Battery } from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';

const MainLayout: React.FC<{ onSignOut: () => Promise<void> }> = ({ onSignOut }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isTestsOpen, setIsTestsOpen] = useState<boolean>(false);
  const [isBackupHubOpen, setIsBackupHubOpen] = useState<boolean>(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);
  const [isAccessPanelOpen, setIsAccessPanelOpen] = useState<boolean>(false);

  const { theme, mobileFrameMode, setMobileFrameMode } = useApp();
  const isDark = theme === 'dark';

  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Handle browser back button & hardware back navigation (e.g., Android Chrome back gesture)
  const handleNavigateTab = (tab: TabType) => {
    if (tab === activeTab) return;
    window.history.pushState({ tab }, '', `#${tab}`);
    setActiveTab(tab);
  };

  useEffect(() => {
    const currentHash = window.location.hash.replace('#', '') as TabType;
    const validTabs: TabType[] = [
      'dashboard',
      'premium',
      'attendance',
      'overtime',
      'factories',
      'employees',
      'boarding',
      'payroll',
      'invoices',
      'receipts',
      'reports',
      'audit',
      'profile',
    ];
    const initialTab: TabType = validTabs.includes(currentHash) ? currentHash : 'dashboard';

    if (initialTab !== 'dashboard') {
      setActiveTab(initialTab);
    }

    if (!window.history.state?.tab) {
      window.history.replaceState({ tab: initialTab }, '', `#${initialTab}`);
    }

    const handlePopState = (event: PopStateEvent) => {
      // 1. If any modal is open, back button closes the modal
      if (isInstallModalOpen) {
        setIsInstallModalOpen(false);
        return;
      }
      if (isTestsOpen) {
        setIsTestsOpen(false);
        return;
      }
      if (isBackupHubOpen) {
        setIsBackupHubOpen(false);
        return;
      }
      if (isQuickActionOpen) {
        setIsQuickActionOpen(false);
        return;
      }

      // 2. Mona ekaka hitiyath back karama dashboard ekata enna one:
      // Return to previous tab or dashboard
      const targetTab: TabType = event.state?.tab || 'dashboard';
      setActiveTab(targetTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isInstallModalOpen, isTestsOpen, isBackupHubOpen, isQuickActionOpen]);

  return (
    <div
      className={`rh-app-shell ${isDark ? 'rh-theme-dark bg-[#090F15] text-slate-100' : 'rh-theme-light bg-slate-50 text-slate-800'} min-h-screen w-full max-w-full overflow-x-hidden transition-colors duration-200 font-sans ${mobileFrameMode ? 'p-0 md:p-8 flex items-center justify-center' : ''}`}
    >
      {/* Phone Device Frame Wrap (If enabled on desktop, exactly like the user's screenshot mockup!) */}
      <div
        className={`w-full max-w-full overflow-x-hidden transition-all ${
          mobileFrameMode
            ? 'md:max-w-[420px] md:h-[915px] md:rounded-[52px] md:border-[10px] md:border-slate-800 md:shadow-2xl md:overflow-hidden md:relative flex flex-col md:ring-1 md:ring-white/20'
            : 'flex flex-col min-h-screen'
        } ${isDark ? 'bg-[#090F15]' : 'bg-slate-50'}`}
      >
        {/* Dynamic Island & Mobile Status Bar (Rendered inside phone frame mockup) */}
        {mobileFrameMode && (
          <div className="hidden md:flex items-center justify-between px-7 pt-3 pb-2 z-50 text-[11px] font-bold select-none text-inherit">
            <span>{currentTime}</span>
            {/* Dynamic Island Pill */}
            <div className="w-24 h-5 rounded-full bg-black flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 mr-2"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-950/60"></span>
            </div>
            <div className="flex items-center space-x-1.5 text-inherit">
              <Wifi className="w-3.5 h-3.5" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Top Navbar */}
        <Navbar
          onOpenTests={() => setIsTestsOpen(true)}
          onOpenBackupHub={() => setIsBackupHubOpen(true)}
          onQuickAction={() => setIsQuickActionOpen(true)}
          onOpenInstall={() => setIsInstallModalOpen(true)}
          onOpenProfile={() => handleNavigateTab('profile')}
          activeTab={activeTab}
          onBackToDashboard={() => handleNavigateTab('dashboard')}
          onManageAccess={() => setIsAccessPanelOpen(true)}
          onSignOut={() => { void onSignOut(); }}
        />

        {/* Navigation Tabs (Desktop Top Bar + Floating Bottom Dock) */}
        <NavigationTabs
          activeTab={activeTab}
          setActiveTab={handleNavigateTab}
          onOpenBackupHub={() => setIsBackupHubOpen(true)}
          onOpenTests={() => setIsTestsOpen(true)}
          onQuickAction={() => setIsQuickActionOpen(true)}
        />

        {/* Main Content Area */}
        <main
          className={`rh-main-content flex-1 w-full max-w-full mx-auto overflow-y-auto overflow-x-hidden ${mobileFrameMode ? 'md:max-h-[740px] scrollbar-none' : ''}`}
        >
          <div className={`rh-screen-content rh-screen-${activeTab}`}>
          {activeTab === 'dashboard' && (
            <DashboardView
              setActiveTab={handleNavigateTab}
              onOpenTests={() => setIsTestsOpen(true)}
              onOpenBackupHub={() => setIsBackupHubOpen(true)}
              onOpenInstall={() => setIsInstallModalOpen(true)}
            />
          )}
          {activeTab === 'premium' && <PremiumDashboardView />}
          {activeTab === 'attendance' && <AttendanceView />}
          {activeTab === 'overtime' && <OvertimeApprovalView />}
          {activeTab === 'factories' && <FactoriesView />}
          {activeTab === 'employees' && <EmployeesView />}
          {activeTab === 'boarding' && <BoardingView />}
          {activeTab === 'payroll' && <PayrollView />}
          {activeTab === 'invoices' && <InvoicesView />}
          {activeTab === 'receipts' && <ReceiptsView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'audit' && <AuditView />}
          {activeTab === 'profile' && (
            <ProfileView onBackToDashboard={() => handleNavigateTab('dashboard')} />
          )}
          </div>
        </main>
      </div>

      {/* Quick Action Modal (Triggered by Center FAB '+' / ⚡) */}
      <QuickActionModal
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        setActiveTab={handleNavigateTab}
        onOpenBackupHub={() => setIsBackupHubOpen(true)}
        onOpenTests={() => setIsTestsOpen(true)}
      />

      {/* 20 Business Rule Automated Test Suite Modal */}
      <TestSuiteModal isOpen={isTestsOpen} onClose={() => setIsTestsOpen(false)} />

      {/* Forever Backup & Safety Hub Modal */}
      <BackupHubModal
        isOpen={isBackupHubOpen}
        onClose={() => setIsBackupHubOpen(false)}
        onOpenInstall={() => setIsInstallModalOpen(true)}
      />

      {/* Android Native Install & APK Modal */}
      <InstallAppModal isOpen={isInstallModalOpen} onClose={() => setIsInstallModalOpen(false)} />

      {/* Server-authorized user invitation and approval */}
      {!PUBLIC_DEMO_MODE && <AdminAccessPanel isOpen={isAccessPanelOpen} onClose={() => setIsAccessPanelOpen(false)} />}
    </div>
  );
};

const PUBLIC_DEMO_MODE = import.meta.env.VITE_PUBLIC_DEMO_MODE === 'true';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  // Public preview uses a local-only demo identity. Cloud authentication is not bypassed
  // for production records: AppContext disables cloud sync and realtime in this mode.
  if (PUBLIC_DEMO_MODE) {
    const demoUser = {
      id: 'royal-pay-public-demo',
      name: 'Public Demo',
      email: '',
      role: 'admin' as const,
      active: true,
      assignedFactoryIds: [],
    };
    return (
      <>
        <AppProvider key={demoUser.id} initialUser={demoUser}>
          <MainLayout onSignOut={async () => { window.location.reload(); }} />
        </AppProvider>
        {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      </>
    );
  }

  return (
    <AuthGate>
      {(user, onSignOut) => (
        <>
          <AppProvider key={user.id} initialUser={user}>
            <MainLayout onSignOut={onSignOut} />
          </AppProvider>
          {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
        </>
      )}
    </AuthGate>
  );
}
