import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { NavigationTabs, TabType } from './components/NavigationTabs';
import { DashboardView } from './components/DashboardView';
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
import { Wifi, Battery, Smartphone, ArrowLeft } from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';

const MainLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isTestsOpen, setIsTestsOpen] = useState<boolean>(false);
  const [isBackupHubOpen, setIsBackupHubOpen] = useState<boolean>(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

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
      className={`min-h-screen w-full max-w-full overflow-x-hidden transition-colors duration-200 font-sans ${
        isDark ? 'bg-[#090F15] text-slate-100' : 'bg-slate-50 text-slate-800'
      } ${mobileFrameMode ? 'p-0 md:p-8 flex items-center justify-center' : ''}`}
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
          className={`flex-1 w-full max-w-full mx-auto p-3 sm:p-5 lg:p-6 overflow-y-auto overflow-x-hidden ${
            mobileFrameMode ? 'md:max-h-[740px] scrollbar-none' : 'max-w-7xl'
          }`}
        >
          {/* Quick "Back to Dashboard" Banner when on any other module */}
          {activeTab !== 'dashboard' && (
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => handleNavigateTab('dashboard')}
                className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs group cursor-pointer ${
                  isDark
                    ? 'bg-[#111b24] border-white/10 text-[#00E5C9] hover:bg-[#162430] hover:border-[#00E5C9]/40'
                    : 'bg-white border-slate-200 text-emerald-700 hover:bg-slate-50 hover:border-emerald-300'
                }`}
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                <span>Back to Dashboard</span>
              </button>
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-slate-400'
                    : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}
              >
                {activeTab} module
              </span>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              setActiveTab={handleNavigateTab}
              onOpenTests={() => setIsTestsOpen(true)}
              onOpenBackupHub={() => setIsBackupHubOpen(true)}
              onOpenInstall={() => setIsInstallModalOpen(true)}
            />
          )}
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
    </div>
  );
};

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      <AppProvider>
        <MainLayout />
      </AppProvider>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
    </>
  );
}
