import React from 'react';
import brandLogo from '../../brand-kit-export/company-logo/royal-hires-full-company-logo-white-1600x600.png';
import {
  ArrowLeft,
  Bell,
  Download,
  Moon,
  Monitor,
  ShieldCheck,
  Smartphone,
  Sun,
  Wifi,
  WifiOff,
  UserRound,
  PlayCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

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
    isOnline,
    toggleOnlineStatus,
    pendingSyncCount,
    theme,
    setTheme,
    mobileFrameMode,
    setMobileFrameMode,
    attendance,
  } = useApp();

  const pendingOtCount = attendance.filter((record) => record.totalOtHours > 0 && record.submissionStatus === 'submitted').length;
  const initials = currentUser.name.split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const roleName = currentUser.role === 'admin' ? 'Administrator' : currentUser.role === 'office_staff' ? 'Office staff' : 'Supervisor';

  return (
    <header className="rh-topbar">
      <div className="rh-topbar-inner">
        <div className="rh-topbar-brand-group">
          {activeTab && activeTab !== 'dashboard' && onBackToDashboard && (
            <button className="rh-topbar-back" onClick={onBackToDashboard} aria-label="Back to dashboard" title="Back to dashboard">
              <ArrowLeft size={18} />
            </button>
          )}
          <img
            className="rh-brand-logo"
            src={brandLogo}
            alt="Royal Hires Private Limited"
            draggable={false}
          />
        </div>

        <div className="rh-topbar-actions">
          <span className={`rh-header-connection ${isOnline ? 'online' : 'offline'}`} title={isOnline ? 'Connected' : 'Offline mode'}>
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span>{isOnline ? 'Online' : 'Offline'}</span>
            {pendingSyncCount > 0 && <b>{pendingSyncCount}</b>}
          </span>

          <button className="rh-topbar-icon rh-desktop-tool" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <button className="rh-topbar-icon rh-desktop-tool" onClick={onOpenTests} title="Run system tests"><PlayCircle size={17} /></button>
          <button className="rh-topbar-icon rh-desktop-tool" onClick={onOpenBackupHub} title="Backup centre"><ShieldCheck size={17} /></button>
          {onOpenInstall && (
            <button className="rh-topbar-icon" onClick={onOpenInstall} title="App installation help"><Download size={17} /></button>
          )}
          <button className="rh-topbar-icon rh-notification-button" onClick={onQuickAction} title={`${pendingOtCount} pending overtime approvals`} aria-label="Open notifications and quick actions">
            <Bell size={17} />
            {pendingOtCount > 0 && <span className="rh-notification-dot">{pendingOtCount > 9 ? '9+' : pendingOtCount}</span>}
          </button>
          {onOpenProfile && (
            <button className="rh-current-user" onClick={onOpenProfile} title={`Open ${roleName} profile`}>
              <span className="rh-current-user-avatar">{initials || <UserRound size={17} />}</span>
              <span className="rh-current-user-copy"><strong>{currentUser.name.split(' ')[0]}</strong><small>{roleName}</small></span>
            </button>
          )}
          <select
            className="rh-role-select"
            aria-label="Switch demo user role"
            value={currentUser.id}
            onChange={(event) => {
              const selected = allUsers.find((user) => user.id === event.target.value);
              if (selected) setCurrentUser(selected);
            }}
          >
            {allUsers.map((user) => <option key={user.id} value={user.id}>{user.role === 'admin' ? 'Admin' : user.role === 'office_staff' ? 'Office' : 'Supervisor'}</option>)}
          </select>
          <button className="rh-frame-toggle" onClick={() => setMobileFrameMode(!mobileFrameMode)} title="Toggle mobile preview frame">
            {mobileFrameMode ? <Smartphone size={15} /> : <Monitor size={15} />}
            <span>{mobileFrameMode ? 'Phone preview' : 'Preview'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
