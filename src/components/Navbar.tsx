import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Wifi,
  WifiOff,
  Shield,
  RefreshCw,
  PlayCircle,
  ShieldCheck,
  Moon,
  Sun,
  Smartphone,
  Monitor,
  Bell,
  CheckCircle2,
  ArrowLeft,
  Download,
} from 'lucide-react';

interface NavbarProps {
  onOpenTests: () => void;
  onOpenBackupHub: () => void;
  onQuickAction: () => void;
  onOpenInstall?: () => void;
  onOpenProfile?: () => void;
  activeTab?: string;
  onBackToDashboard?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenTests,
  onOpenBackupHub,
  onQuickAction,
  onOpenInstall,
  onOpenProfile,
  activeTab,
  onBackToDashboard,
}) => {
  const {
    currentUser,
    allUsers,
    setCurrentUser,
    t,
    isOnline,
    toggleOnlineStatus,
    pendingSyncCount,
    syncOfflineQueue,
    theme,
    setTheme,
    mobileFrameMode,
    setMobileFrameMode,
    attendance,
  } = useApp();

  const isDark = theme === 'dark';

  const pendingOtCount = attendance.filter(
    (a) => a.totalOtHours > 0 && a.submissionStatus === 'submitted'
  ).length;

  return (
    <header
      className={`sticky top-0 z-40 w-full max-w-full overflow-hidden transition-colors ${
        isDark
          ? 'bg-[#090f15]/90 backdrop-blur-md border-b border-white/8 text-white'
          : 'bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-800 shadow-xs'
      }`}
    >
      <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-18 w-full min-w-0">
          {/* Left: Back button (when not on dashboard) and Avatar & Greeting */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 shrink">
            {activeTab && activeTab !== 'dashboard' && onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer shrink-0 shadow-xs group ${
                  isDark
                    ? 'bg-[#00E5C9]/15 border-[#00E5C9]/35 text-[#00E5C9] hover:bg-[#00E5C9]/25'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                }`}
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
                <span className="font-bold">Dashboard</span>
              </button>
            )}

            <div className="relative cursor-pointer shrink-0" onClick={onQuickAction}>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-[#00E5C9] via-emerald-500 to-teal-400 p-0.5 shadow-md shadow-[#00E5C9]/20">
                <div
                  className={`w-full h-full rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                    isDark ? 'bg-[#0E1720] text-[#00E5C9]' : 'bg-white text-emerald-700'
                  }`}
                >
                  {currentUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#090f15]"></span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 truncate">
                <h2 className="font-bold text-xs sm:text-base tracking-tight leading-tight truncate">
                  {currentUser.name.split(' ')[0]}
                </h2>
                <span
                  className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-full border shrink-0 ${
                    isDark
                      ? 'bg-emerald-500/10 text-[#00E5C9] border-[#00E5C9]/25'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {currentUser.role === 'admin'
                    ? 'Admin'
                    : currentUser.role === 'office_staff'
                    ? 'Office'
                    : 'Supervisor'}
                </span>
              </div>
              <p className={`text-[10px] truncate hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {t.tagline.split('•')[0]}
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
            {/* Desktop Mobile Frame View Toggle */}
            <button
              onClick={() => setMobileFrameMode(!mobileFrameMode)}
              className={`hidden md:flex items-center space-x-1 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                mobileFrameMode
                  ? 'bg-[#00E5C9] text-slate-950 border-[#00E5C9] shadow-sm shadow-[#00E5C9]/40'
                  : isDark
                  ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Toggle Mobile Mockup Frame on Desktop"
            >
              {mobileFrameMode ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
              <span>{mobileFrameMode ? 'Phone Frame' : 'Full Screen'}</span>
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-1.5 sm:p-2 rounded-full border transition cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-[#00E5C9] border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="Toggle Dark / Light Mode"
            >
              {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Install App / Android APK Button */}
            {onOpenInstall && (
              <button
                onClick={onOpenInstall}
                className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer shadow-xs ${
                  isDark
                    ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-[#00E5C9] border-[#00E5C9]/35'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
                title="Install App on Android Phone / APK"
              >
                <Download className="w-3.5 h-3.5 text-[#00E5C9] shrink-0" />
                <span className="hidden xs:inline font-bold">Install</span>
              </button>
            )}

            {/* Managing Director & Developer Profile Shortcut */}
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className={`flex items-center space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer shadow-xs ${
                  activeTab === 'profile'
                    ? isDark
                      ? 'bg-[#00E5C9] text-slate-950 border-[#00E5C9]'
                      : 'bg-emerald-700 text-white border-emerald-700'
                    : isDark
                    ? 'bg-blue-500/15 hover:bg-blue-500/25 text-blue-300 border-blue-500/35'
                    : 'bg-blue-50 hover:bg-blue-100 text-blue-900 border-blue-300'
                }`}
                title="Managing Director & Developer Profile (Thusith Dissanayake)"
              >
                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                <span className="truncate max-w-[80px] sm:max-w-none">MD Profile</span>
              </button>
            )}

            {/* Forever Backup Hub Indicator (Desktop/Tablet) */}
            <button
              onClick={onOpenBackupHub}
              className={`hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                isDark
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-[#00E5C9] border-[#00E5C9]/30'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}
              title="Forever Data Backup Status & Hub"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#00E5C9] shrink-0" />
              <span>Backup</span>
            </button>

            {/* Notification / Alert Icon (Pending OT & Sync) */}
            <button
              onClick={onQuickAction}
              className={`relative p-1.5 sm:p-2 rounded-full border transition cursor-pointer ${
                isDark
                  ? 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title={`${pendingOtCount} pending OT approvals`}
            >
              <Bell className="w-3.5 h-3.5" />
              {(pendingOtCount > 0 || pendingSyncCount > 0) && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>
              )}
            </button>

            {/* Online / Offline Simulator Toggle */}
            <button
              onClick={toggleOnlineStatus}
              className={`flex items-center space-x-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                isOnline
                  ? isDark
                    ? 'bg-white/5 text-emerald-400 border-white/10 hover:bg-white/10'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-500 text-slate-950 border-amber-400 font-bold animate-pulse'
              }`}
              title="Click to toggle Online / Offline mode"
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isOnline ? t.common.online : t.common.offline}</span>
            </button>

            {/* Role Switcher */}
            <div className="relative">
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const sel = allUsers.find((u) => u.id === e.target.value);
                  if (sel) setCurrentUser(sel);
                }}
                className={`text-[10px] sm:text-xs font-semibold rounded-full px-2 py-1 sm:px-2.5 sm:py-1.5 border focus:outline-none cursor-pointer max-w-[70px] sm:max-w-none truncate ${
                  isDark
                    ? 'bg-slate-900 text-slate-200 border-white/12'
                    : 'bg-white text-slate-800 border-slate-300'
                }`}
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id} className={isDark ? 'bg-[#0E1720] text-white' : 'bg-white text-slate-900'}>
                    {u.role === 'admin' ? 'Admin' : u.role === 'office_staff' ? 'Office' : 'Supervisor'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
