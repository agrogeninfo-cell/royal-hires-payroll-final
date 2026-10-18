import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Building2,
  CalendarCheck,
  Clock3,
  Receipt,
  FileText,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  MapPin,
  UserRound,
  WalletCards,
  Home,
  Settings,
  ClipboardCheck,
  Download,
  Wifi,
  WifiOff,
  CheckCircle2,
  CircleAlert,
  Plus,
  Zap,
} from 'lucide-react';
import { TabType } from './NavigationTabs';
import { getProfilePhoto, subscribeToPhotoUpdates } from '../utils/profilePhotoHelper';

interface DashboardViewProps {
  setActiveTab: (tab: TabType) => void;
  onOpenTests: () => void;
  onOpenBackupHub: () => void;
}

const localDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const money = (amount: number) => `LKR ${Number(amount || 0).toLocaleString('en-LK')}`;

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  onOpenTests,
  onOpenBackupHub,
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
  } = useApp();

  const isDark = theme === 'dark';
  const isSupervisor = currentUser.role === 'supervisor';
  const assignedFactoryIds = currentUser.assignedFactoryIds || [];
  const accessibleFactories = isSupervisor
    ? factories.filter((factory) => assignedFactoryIds.includes(factory.id))
    : factories;
  const accessibleEmployees = isSupervisor
    ? employees.filter((employee) => assignedFactoryIds.includes(employee.currentFactoryId))
    : employees;

  const [activeFactoryFilter, setActiveFactoryFilter] = useState('all');
  const [mdPhoto, setMdPhoto] = useState(getProfilePhoto());

  useEffect(() => subscribeToPhotoUpdates(setMdPhoto), []);

  const now = new Date();
  const today = localDateKey(now);
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const formattedDate = now.toLocaleDateString('en-LK', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  const todayAttendance = useMemo(() => attendance.filter((record) => {
    if (record.date !== today) return false;
    if (isSupervisor && !assignedFactoryIds.includes(record.factoryId)) return false;
    if (activeFactoryFilter !== 'all' && record.factoryId !== activeFactoryFilter) return false;
    return true;
  }), [attendance, today, isSupervisor, assignedFactoryIds, activeFactoryFilter]);

  const pendingOtApprovals = attendance.filter((record) => record.totalOtHours > 0 && record.submissionStatus === 'submitted');
  const presentCount = todayAttendance.filter((record) => record.status === 'present').length;
  const absentCount = todayAttendance.filter((record) => record.status === 'absent').length;
  const leaveCount = todayAttendance.filter((record) => record.status === 'leave').length;
  const halfDayCount = todayAttendance.filter((record) => record.status === 'half_day').length;
  const attendanceRate = accessibleEmployees.length > 0
    ? Math.min(100, Math.round((presentCount / accessibleEmployees.length) * 100))
    : 0;

  const totalInvoiced = invoices.reduce((sum, invoice) => sum + (invoice.totalAmount || 0), 0);
  const totalCollected = receipts.reduce((sum, receipt) => sum + (receipt.amount || 0), 0);
  const totalOutstanding = invoices.reduce((sum, invoice) => sum + (invoice.outstandingBalance || 0), 0);
  const totalPayrollOutlay = payrollRuns.reduce((sum, run) => sum + (run.totalNet || 0), 0);
  const totalAllRecords = factories.length + employees.length + attendance.length + payrollRuns.length + invoices.length + receipts.length;
  const displayedFactories = activeFactoryFilter === 'all'
    ? accessibleFactories
    : accessibleFactories.filter((factory) => factory.id === activeFactoryFilter);

  const modules: Array<{
    id: TabType;
    label: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
    style: string;
    hidden?: boolean;
  }> = [
    { id: 'employees', label: 'Employees', subtitle: 'Worker records', icon: Users, style: 'rh-module-green', hidden: isSupervisor },
    { id: 'attendance', label: 'Attendance', subtitle: 'Daily attendance', icon: CalendarCheck, style: 'rh-module-blue' },
    { id: 'payroll', label: 'Payroll', subtitle: 'Wages & payslips', icon: WalletCards, style: 'rh-module-teal', hidden: isSupervisor },
    { id: 'overtime', label: 'OT approvals', subtitle: 'Review overtime', icon: Clock3, style: 'rh-module-amber', hidden: isSupervisor },
    { id: 'factories', label: 'Factories', subtitle: 'Clients & rates', icon: Building2, style: 'rh-module-violet', hidden: isSupervisor },
    { id: 'boarding', label: 'Boarding', subtitle: 'Locations & costs', icon: Home, style: 'rh-module-cyan', hidden: isSupervisor },
    { id: 'invoices', label: 'Invoices', subtitle: 'Factory billing', icon: FileText, style: 'rh-module-sky', hidden: isSupervisor },
    { id: 'reports', label: 'Reports', subtitle: 'Business overview', icon: BarChart3, style: 'rh-module-indigo', hidden: isSupervisor },
    { id: 'profile', label: 'Settings', subtitle: 'System preferences', icon: Settings, style: 'rh-module-slate' },
  ];

  const visibleModules = modules.filter((module) => !module.hidden);
  const statCards = [
    { label: 'Total staff', value: accessibleEmployees.length, foot: 'Registered workforce', icon: Users, style: 'rh-stat-green', tab: 'employees' as TabType },
    { label: 'Present', value: presentCount, foot: `${attendanceRate}% of workforce`, icon: CheckCircle2, style: 'rh-stat-blue', tab: 'attendance' as TabType },
    { label: 'Absent', value: absentCount, foot: 'Not at work today', icon: CircleAlert, style: 'rh-stat-red', tab: 'attendance' as TabType },
    { label: 'On leave', value: leaveCount, foot: 'Approved leave records', icon: ClipboardCheck, style: 'rh-stat-amber', tab: 'attendance' as TabType },
  ];

  return (
    <div className={`rh-dashboard ${isDark ? 'rh-dashboard-dark' : ''}`}>
      <section className="rh-welcome-panel">
        <div className="rh-welcome-copy">
          <span className="rh-eyebrow"><span className="rh-live-dot" /> WORKFORCE OVERVIEW</span>
          <h1>{greeting}, {currentUser.name.split(' ')[0]} <span className="rh-wave">✦</span></h1>
          <p>Here’s what’s happening across your workforce today.</p>
          <div className="rh-date-line"><CalendarCheck size={14} /> {formattedDate}</div>
        </div>
        <div className="rh-welcome-actions">
          <button className="rh-primary-button" onClick={() => setActiveTab('attendance')}>
            <Plus size={17} /> Mark attendance
          </button>
          <div className={`rh-connection-pill ${isOnline ? 'is-online' : 'is-offline'}`}>
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            {isOnline ? 'Online' : 'Offline'}
            {pendingSyncCount > 0 && <span className="rh-sync-count">{pendingSyncCount} pending</span>}
          </div>
        </div>
        <div className="rh-welcome-decoration" aria-hidden="true"><span /><span /><span /></div>
      </section>

      <section className="rh-dashboard-section">
        <div className="rh-section-heading">
          <div><h2>Today at a glance</h2><p>Live figures from attendance records</p></div>
          <button className="rh-text-button" onClick={() => setActiveTab('reports')}>View reports <ArrowRight size={15} /></button>
        </div>
        <div className="rh-stats-grid">
          {statCards.map(({ label, value, foot, icon: Icon, style, tab }) => (
            <button key={label} className={`rh-stat-card ${style}`} onClick={() => setActiveTab(tab)}>
              <span className="rh-stat-icon"><Icon size={18} /></span>
              <span className="rh-stat-value">{value.toLocaleString()}</span>
              <span className="rh-stat-label">{label}</span>
              <span className="rh-stat-foot">{foot}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rh-dashboard-section">
        <div className="rh-section-heading">
          <div><h2>Quick access</h2><p>Your everyday workforce tools</p></div>
          <span className="rh-section-count">{visibleModules.length} modules</span>
        </div>
        <div className="rh-module-grid">
          {visibleModules.map(({ id, label, subtitle, icon: Icon, style }) => (
            <button key={id} className={`rh-module-tile ${style}`} onClick={() => setActiveTab(id)}>
              <span className="rh-module-icon"><Icon className="rh-module-icon-svg" /></span>
              <span className="rh-module-title">{label}</span>
              <span className="rh-module-subtitle">{subtitle}</span>
              <ArrowRight className="rh-module-arrow" size={14} />
            </button>
          ))}
        </div>
      </section>

      <section className="rh-dashboard-section">
        <div className="rh-section-heading">
          <div><h2>Attendance summary</h2><p>Daily attendance status</p></div>
          <button className="rh-text-button" onClick={() => setActiveTab('attendance')}>Manage <ChevronRight size={15} /></button>
        </div>
        <div className="rh-attendance-panel">
          <div className="rh-attendance-chart" aria-label={`${attendanceRate}% present today`}>
            <svg viewBox="0 0 100 100" role="img" aria-hidden="true">
              <circle className="rh-chart-track" cx="50" cy="50" r="39" />
              <circle className="rh-chart-progress" cx="50" cy="50" r="39" strokeDasharray={`${(attendanceRate / 100) * 245} 245`} />
            </svg>
            <div className="rh-chart-center"><strong>{attendanceRate}%</strong><span>Present</span></div>
          </div>
          <div className="rh-attendance-detail">
            <div className="rh-attendance-topline"><strong>{todayAttendance.length} records</strong><span>{accessibleEmployees.length} staff members</span></div>
            <div className="rh-attendance-legend">
              <div><span className="rh-legend-dot present" /><span>Present</span><strong>{presentCount}</strong></div>
              <div><span className="rh-legend-dot absent" /><span>Absent</span><strong>{absentCount}</strong></div>
              <div><span className="rh-legend-dot leave" /><span>On leave</span><strong>{leaveCount}</strong></div>
              <div><span className="rh-legend-dot halfday" /><span>Half day</span><strong>{halfDayCount}</strong></div>
            </div>
            {accessibleEmployees.length > todayAttendance.length && (
              <p className="rh-attendance-note">{accessibleEmployees.length - todayAttendance.length} staff records are not marked yet.</p>
            )}
            <button className="rh-secondary-button" onClick={() => setActiveTab('attendance')}>Open attendance <ArrowRight size={15} /></button>
          </div>
        </div>
      </section>

      {!isSupervisor && (
        <section className="rh-dashboard-section">
          <div className="rh-section-heading">
            <div><h2>Finance snapshot</h2><p>Billing and payroll overview</p></div>
            <button className="rh-text-button" onClick={() => setActiveTab('reports')}>Full report <ArrowRight size={15} /></button>
          </div>
          <div className="rh-finance-grid">
            <div className="rh-finance-card"><span className="rh-finance-icon finance-green"><FileText size={17} /></span><span className="rh-finance-label">Total invoiced</span><strong>{money(totalInvoiced)}</strong><small>Factory billings</small></div>
            <div className="rh-finance-card"><span className="rh-finance-icon finance-blue"><Receipt size={17} /></span><span className="rh-finance-label">Collected</span><strong>{money(totalCollected)}</strong><small>Payments received</small></div>
            <div className="rh-finance-card"><span className="rh-finance-icon finance-red"><CircleAlert size={17} /></span><span className="rh-finance-label">Outstanding</span><strong>{money(totalOutstanding)}</strong><small>Balance due</small></div>
            <div className="rh-finance-card"><span className="rh-finance-icon finance-violet"><WalletCards size={17} /></span><span className="rh-finance-label">Payroll outlay</span><strong>{money(totalPayrollOutlay)}</strong><small>Net payroll processed</small></div>
          </div>
        </section>
      )}

      <section className="rh-dashboard-section">
        <div className="rh-section-heading rh-factory-heading">
          <div><h2>Client factories</h2><p>Workplaces and active rate cards</p></div>
          {!isSupervisor && <button className="rh-text-button" onClick={() => setActiveTab('factories')}>Manage factories <ArrowRight size={15} /></button>}
        </div>
        <div className="rh-filter-row">
          <button className={activeFactoryFilter === 'all' ? 'rh-filter-chip active' : 'rh-filter-chip'} onClick={() => setActiveFactoryFilter('all')}>All workplaces</button>
          {accessibleFactories.map((factory) => (
            <button key={factory.id} className={activeFactoryFilter === factory.id ? 'rh-filter-chip active' : 'rh-filter-chip'} onClick={() => setActiveFactoryFilter(factory.id)}>{factory.name.split(' ')[0]}</button>
          ))}
        </div>
        {displayedFactories.length === 0 ? (
          <div className="rh-empty-card"><Building2 size={25} /><strong>No factories to show</strong><span>Assigned workplaces will appear here.</span></div>
        ) : (
          <div className="rh-factory-grid">
            {displayedFactories.map((factory) => {
              const factoryStaff = accessibleEmployees.filter((employee) => employee.currentFactoryId === factory.id).length;
              const mainRate = factory.billingMethod === 'SAME_RATE_FOR_ALL' ? factory.sameRate : factory.maleRate;
              return (
                <article key={factory.id} className="rh-factory-card">
                  <div className="rh-factory-card-top"><span className="rh-factory-symbol"><Building2 size={18} /></span><span className="rh-factory-code">{factory.code}</span></div>
                  <h3>{factory.name}</h3>
                  <p className="rh-factory-address"><MapPin size={13} /> {factory.address || 'Workplace address not set'}</p>
                  <div className="rh-factory-meta"><div><span>Assigned staff</span><strong>{factoryStaff}</strong></div><div><span>Daily rate</span><strong>{money(Number(mainRate || 0))}</strong></div></div>
                  {factory.billingMethod !== 'SAME_RATE_FOR_ALL' && <p className="rh-rate-subline">Female rate: {money(Number(factory.femaleRate || 0))} / day</p>}
                  <button className="rh-factory-action" onClick={() => setActiveTab(isSupervisor ? 'attendance' : 'factories')}>{isSupervisor ? 'Mark attendance' : 'View rate details'} <ArrowRight size={14} /></button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rh-system-panel">
        <div className="rh-system-main">
          <span className="rh-system-shield"><ShieldCheck size={23} /></span>
          <div><h3>System safety & backups</h3><p>{isOnline ? 'Connection available' : 'Offline mode enabled'} · Last backup {lastBackupTime || 'not available'}</p><small>{totalAllRecords.toLocaleString()} business records tracked{pendingSyncCount > 0 ? ` · ${pendingSyncCount} waiting to sync` : ''}</small></div>
        </div>
        <div className="rh-system-actions">
          <button className="rh-system-button" onClick={onOpenBackupHub}>Backup centre</button>
          <button className="rh-system-button" onClick={() => void downloadForeverBackup()}><Download size={15} /> Export backup</button>
          <button className="rh-system-button" onClick={onOpenTests}>System tests</button>
        </div>
      </section>

      <section className="rh-director-card">
        <img src={mdPhoto} alt="Thusith Dissanayake" />
        <div className="rh-director-copy"><span>PRODUCT OWNER & SYSTEM DESIGNER</span><h3>Thusith Dissanayake</h3><p>Managing Director · Royal Hires (Pvt) Ltd</p></div>
        <button aria-label="View developer profile" onClick={() => setActiveTab('profile')}><ArrowRight size={18} /></button>
      </section>
    </div>
  );
};
