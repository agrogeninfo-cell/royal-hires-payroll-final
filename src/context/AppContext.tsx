import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Language,
  Factory,
  Employee,
  AttendanceRecord,
  PayrollRun,
  EmployeePayment,
  FactoryInvoice,
  FactoryReceipt,
  BoardingLocation,
  AuditLog,
  OfflineQueueItem,
} from '../types';
import { dbService } from '../db/indexedDb';
import { SyncService } from '../services/syncService';
import { getCurrentSession, getSupabaseClient, loadAccessProfile } from '../services/authService';
import { translations } from '../i18n/translations';

interface AppContextType {
  currentUser: User;
  allUsers: User[];
  setCurrentUser: (user: User) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (typeof translations)['en'];
  isOnline: boolean;
  toggleOnlineStatus: () => void;
  pendingSyncCount: number;
  syncOfflineQueue: () => Promise<void>;
  
  // Data
  factories: Factory[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  payrollRuns: PayrollRun[];
  payments: EmployeePayment[];
  invoices: FactoryInvoice[];
  receipts: FactoryReceipt[];
  boardingLocations: BoardingLocation[];
  auditLogs: AuditLog[];
  
  // Refresh
  reloadData: () => Promise<void>;

  // Operations
  saveFactory: (factory: Factory) => Promise<void>;
  saveEmployee: (employee: Employee) => Promise<void>;
  saveAttendance: (record: AttendanceRecord) => Promise<void>;
  batchSaveAttendance: (records: AttendanceRecord[]) => Promise<void>;
  approveAttendanceOT: (attendanceId: string, approve: boolean) => Promise<void>;
  savePayrollRun: (run: PayrollRun) => Promise<void>;
  savePayment: (payment: EmployeePayment) => Promise<void>;
  saveInvoice: (invoice: FactoryInvoice) => Promise<void>;
  saveReceipt: (receipt: FactoryReceipt) => Promise<void>;
  saveBoardingLocation: (location: BoardingLocation) => Promise<void>;
  resetDatabase: () => Promise<void>;
  exportBackupJson: () => Promise<string>;
  importBackupJson: (jsonData: string) => Promise<void>;
  downloadForeverBackup: () => Promise<void>;
  restoreFromForeverMirror: () => Promise<boolean>;
  lastBackupTime: string;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  mobileFrameMode: boolean;
  setMobileFrameMode: (enabled: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode; initialUser: User }> = ({ children, initialUser }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [mobileFrameMode, setMobileFrameMode] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [lastBackupTime, setLastBackupTime] = useState<string>(new Date().toLocaleTimeString());

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(initialUser);

  const [factories, setFactories] = useState<Factory[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [payments, setPayments] = useState<EmployeePayment[]>([]);
  const [invoices, setInvoices] = useState<FactoryInvoice[]>([]);
  const [receipts, setReceipts] = useState<FactoryReceipt[]>([]);
  const [boardingLocations, setBoardingLocations] = useState<BoardingLocation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Listen to browser network changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      void syncOfflineQueue().catch((error) => console.error('Cloud sync after reconnect failed:', error));
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const reloadData = async () => {
    try {
      await dbService.init();
      const usersData = await dbService.getAll<User>('users');
      setAllUsers(usersData);

      const isSupervisor = currentUser.role === 'supervisor';
      const assignedFactories = new Set(currentUser.assignedFactoryIds || []);
      // Royal Pay is currently scoped to these two approved factories. Other local
      // factory data is preserved in backup but excluded from operational views/sync.
      const approvedFactoryNames = new Set(['empire teas', 'millennium teas']);
      const allFactories = await dbService.getAll<Factory>('factories');
      const fData = allFactories.filter((factory) => approvedFactoryNames.has(factory.name.trim().toLowerCase()));
      const targetFactoryIds = new Set(fData.map((factory) => factory.id));
      const visibleFactories = isSupervisor ? fData.filter((factory) => assignedFactories.has(factory.id)) : fData;
      setFactories(visibleFactories);

      const allEmployees = await dbService.getAll<Employee>('employees');
      const eData = allEmployees.filter((employee) => targetFactoryIds.has(employee.currentFactoryId));
      const visibleEmployees = isSupervisor ? eData.filter((employee) => assignedFactories.has(employee.currentFactoryId)) : eData;
      setEmployees(visibleEmployees);
      const targetEmployeeIds = new Set(eData.map((employee) => employee.id));

      const allAttendance = await dbService.getAll<AttendanceRecord>('attendance');
      const aData = allAttendance.filter((record) => targetFactoryIds.has(record.factoryId));
      setAttendance((isSupervisor ? aData.filter((record) => assignedFactories.has(record.factoryId)) : aData)
        .sort((a, b) => b.date.localeCompare(a.date)));

      const allPayrollRuns = await dbService.getAll<PayrollRun>('payroll_runs');
      const pData = allPayrollRuns.filter((run) =>
        Array.isArray(run.items) && run.items.length > 0 && run.items.every((item) => targetFactoryIds.has(item.factoryId))
      );
      setPayrollRuns(isSupervisor ? [] : pData.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt)));

      const allPayments = await dbService.getAll<EmployeePayment>('employee_payments');
      const payData = allPayments.filter((payment) => targetEmployeeIds.has(payment.employeeId));
      setPayments(isSupervisor ? [] : payData.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

      const allInvoices = await dbService.getAll<FactoryInvoice>('invoices');
      const invData = allInvoices.filter((invoice) => targetFactoryIds.has(invoice.factoryId));
      setInvoices(isSupervisor ? [] : invData.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

      const allReceipts = await dbService.getAll<FactoryReceipt>('receipts');
      const recData = allReceipts.filter((receipt) => targetFactoryIds.has(receipt.factoryId));
      setReceipts(isSupervisor ? [] : recData.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

      const allBoarding = await dbService.getAll<BoardingLocation>('boarding_locations');
      const targetBoardingIds = new Set(eData.map((employee) => employee.boardingLocationId).filter(Boolean));
      const bData = allBoarding.filter((location) => targetBoardingIds.has(location.id));
      setBoardingLocations(isSupervisor ? [] : bData);

      const allAuditLogs = await dbService.getAll<AuditLog>('audit_logs');
      const visibleEntityIds = new Set<string>([
        ...targetFactoryIds,
        ...targetEmployeeIds,
        ...aData.map((record) => record.id),
        ...pData.map((run) => run.id),
        ...payData.map((payment) => payment.id),
        ...invData.map((invoice) => invoice.id),
        ...recData.map((receipt) => receipt.id),
        ...bData.map((location) => location.id),
      ]);
      const auditData = allAuditLogs.filter((log) => visibleEntityIds.has(log.entityId));
      setAuditLogs(isSupervisor ? [] : auditData.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));

      const queue = await dbService.getOfflineQueue();
      const pendingQueue = queue.filter((q) => q.status === 'pending');
      const queuedAttendanceIds = new Set(pendingQueue.map((q) => q.payload?.id).filter(Boolean));
      const unsyncedAttendance = await dbService.getAll<AttendanceRecord>('attendance');
      const pendingAttendanceNotQueued = unsyncedAttendance.filter((record) =>
        record.syncStatus === 'pending' && !queuedAttendanceIds.has(record.id)
      ).length;
      setPendingSyncCount(pendingQueue.length + pendingAttendanceNotQueued);
    } catch (err) {
      console.error('Error loading data from IndexedDB:', err);
    }
  };

  useEffect(() => {
    void reloadData().then(() => {
      if (navigator.onLine) void syncOfflineQueue().catch((error) => console.error('Initial cloud sync failed:', error));
    });
  }, []);

  const toggleOnlineStatus = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    if (nextState) {
      void syncOfflineQueue().catch((error) => console.error('Cloud sync failed:', error));
    }
  };

  const syncOfflineQueue = async () => {
    try {
      const report = await SyncService.processQueue();
      await reloadData();
      if (report.syncedCount > 0) console.info(`Cloud sync reconciled ${report.syncedCount} records (pushed ${report.pushedCount || 0}, pulled ${report.pulledCount || 0}).`);
      if (report.conflictCount > 0 || report.failedCount > 0) {
        console.warn('Cloud sync needs attention:', report.errors);
      }
      if (report.failedCount > 0) {
        throw new Error('Some records were not confirmed in cloud storage. Local data is preserved. ' + report.errors.slice(0, 3).join(' '));
      }
    } catch (err) {
      console.error('Cloud sync failed:', err);
      throw err;
    }
  };

  // Keep open sessions updated when another approved user changes cloud records.
  useEffect(() => {
    let active = true;
    let channel: ReturnType<ReturnType<typeof getSupabaseClient>['channel']> | undefined;
    void (async () => {
      try {
        const session = await getCurrentSession();
        if (!active || !session?.user?.id) return;
        const access = await loadAccessProfile(session.user.id);
        if (!active || !access || access.approvalStatus !== 'approved' || !access.user.active) return;
        channel = getSupabaseClient()
          .channel('royal-pay-company-' + access.companyId)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'app_records', filter: 'company_id=eq.' + access.companyId }, () => {
            void syncOfflineQueue().catch((error) => console.error('Realtime cloud refresh failed:', error));
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'factories', filter: 'company_id=eq.' + access.companyId }, () => {
            void syncOfflineQueue().catch((error) => console.error('Realtime factory refresh failed:', error));
          })
          .subscribe();
      } catch (error) {
        console.error('Could not start cloud realtime subscription:', error);
      }
    })();
    return () => {
      active = false;
      if (channel) void getSupabaseClient().removeChannel(channel);
    };
  }, [currentUser.id]);

  // Factory Operations
  const saveFactory = async (factory: Factory) => {
    if (currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Only Administrators can create or update factory configurations.');
    }
    factory.updatedAt = new Date().toISOString();
    factory.cloudSyncReady = true;
    await dbService.put('factories', factory);
    await dbService.logAudit(
      currentUser.name,
      currentUser.role,
      'SAVE_FACTORY',
      'Factory',
      factory.id,
      `Saved factory "${factory.name}" with rate method ${factory.billingMethod}`
    );
    await reloadData();
    if (isOnline) await syncOfflineQueue();
  };

  // Employee Operations
  const saveEmployee = async (employee: Employee) => {
    if (currentUser.role === 'supervisor') {
      throw new Error('Unauthorized: Supervisors cannot register or edit employees.');
    }
    // Hard enforce Helper designation
    employee.designation = 'Helper';
    employee.updatedAt = new Date().toISOString();
    employee.cloudSyncReady = true;

    await dbService.put('employees', employee);
    await dbService.logAudit(
      currentUser.name,
      currentUser.role,
      'SAVE_EMPLOYEE',
      'Employee',
      employee.id,
      `Saved helper "${employee.fullName}" (NIC: ${employee.nic}) assigned to factory ${employee.currentFactoryId}`
    );
    await reloadData();
    if (isOnline) await syncOfflineQueue();
  };

  // Attendance Operations (Supports Offline Queueing!)
  const saveAttendance = async (record: AttendanceRecord) => {
    if (currentUser.role === 'supervisor' && !(currentUser.assignedFactoryIds || []).includes(record.factoryId)) {
      throw new Error('Unauthorized: this supervisor is not assigned to the selected factory.');
    }
    record.updatedAt = new Date().toISOString();
    record.cloudSyncReady = true;
    if (!isOnline) {
      // Save locally to offline queue
      record.syncStatus = 'pending';
      record.isOfflineCreated = true;
      await dbService.put('attendance', record);
      await dbService.enqueueOffline('CREATE_ATTENDANCE', record);
      await reloadData();
      return;
    }

    // Online save
    record.syncStatus = 'pending';
    await dbService.put('attendance', record);
    await dbService.logAudit(
      currentUser.name,
      currentUser.role,
      'RECORD_ATTENDANCE',
      'AttendanceRecord',
      record.id,
      `Recorded attendance for ${record.employeeName} (${record.date}, Status: ${record.status}, OT: ${record.totalOtHours}h)`
    );
    await reloadData();
    if (isOnline) await syncOfflineQueue();
  };

  const batchSaveAttendance = async (records: AttendanceRecord[]) => {
    if (currentUser.role === 'supervisor') {
      const assignedFactories = new Set(currentUser.assignedFactoryIds || []);
      if (records.some((record) => !assignedFactories.has(record.factoryId))) {
        throw new Error('Unauthorized: attendance batch contains a factory not assigned to this supervisor.');
      }
    }
    for (const record of records) {
      record.updatedAt = new Date().toISOString();
      record.cloudSyncReady = true;
      if (!isOnline) {
        record.syncStatus = 'pending';
        record.isOfflineCreated = true;
        await dbService.put('attendance', record);
        await dbService.enqueueOffline('CREATE_ATTENDANCE', record);
      } else {
        record.syncStatus = 'pending';
        await dbService.put('attendance', record);
      }
    }
    if (isOnline) {
      await dbService.logAudit(
        currentUser.name,
        currentUser.role,
        'BATCH_RECORD_ATTENDANCE',
        'AttendanceRecord',
        'BATCH',
        `Recorded batch attendance for ${records.length} helpers on ${records[0]?.date || ''}`
      );
    }
    await reloadData();
    if (isOnline) await syncOfflineQueue();
  };

  const approveAttendanceOT = async (attendanceId: string, approve: boolean) => {
    if (currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Only Administrators can approve or reject overtime.');
    }

    const record = await dbService.getById<AttendanceRecord>('attendance', attendanceId);
    if (!record) return;

    record.submissionStatus = approve ? 'approved' : 'rejected';
    record.billable = approve;
    record.approvedBy = currentUser.name;
    record.approvedAt = new Date().toISOString();
    record.updatedAt = new Date().toISOString();
    record.cloudSyncReady = true;

    await dbService.put('attendance', record);
    await dbService.logAudit(
      currentUser.name,
      currentUser.role,
      approve ? 'APPROVE_OVERTIME' : 'REJECT_OVERTIME',
      'AttendanceRecord',
      record.id,
      `${approve ? 'Approved' : 'Rejected'} attendance & overtime (${record.totalOtHours} hrs) for ${record.employeeName}`
    );
    await reloadData();
    if (isOnline) await syncOfflineQueue();
  };

  // Payroll Operations
  const savePayrollRun = async (run: PayrollRun) => {
    if (currentUser.role === 'supervisor') {
      throw new Error('Unauthorized: Supervisors cannot access or process payroll.');
    }
    run.updatedAt = new Date().toISOString();
    run.cloudSyncReady = true;
    await dbService.put('payroll_runs', run);
    await dbService.logAudit(
      currentUser.name,
      currentUser.role,
      'SAVE_PAYROLL',
      'PayrollRun',
      run.id,
      `Processed payroll run #${run.payrollNumber} for period ${run.periodStart} to ${run.periodEnd} (Net: LKR ${run.totalNet})`
    );
    await reloadData();
    if (isOnline) await syncOfflineQueue();
  };

  const savePayment = async (payment: EmployeePayment) => {
    if (currentUser.role === 'supervisor') {
      throw new Error('Unauthorized: Supervisors cannot record payments or advances.');
    }
    payment.updatedAt = new Date().toISOString();
    payment.cloudSyncReady = true;
    await dbService.put('employee_payments', payment);
    await dbService.logAudit(
      currentUser.name,
      currentUser.role,
      'RECORD_PAYMENT',
      'EmployeePayment',
      payment.id,
      `Recorded ${payment.paymentType} of LKR ${payment.amount} for ${payment.employeeName}`
    );
    await reloadData();
    if (isOnline) await syncOfflineQueue();
  };

  // Invoice Operations
  const saveInvoice = async (invoice: FactoryInvoice) => {
    if (currentUser.role === 'supervisor') {
      throw new Error('Unauthorized: Supervisors cannot manage factory invoices.');
    }
    invoice.updatedAt = new Date().toISOString();
    invoice.cloudSyncReady = true;
    await dbService.put('invoices', invoice);
    await dbService.logAudit(
      currentUser.name,
      currentUser.role,
      'SAVE_INVOICE',
      'FactoryInvoice',
      invoice.id,
      `Saved factory invoice #${invoice.invoiceNumber} for ${invoice.factoryName} (Amount: LKR ${invoice.totalAmount})`
    );
    await reloadData();
    if (isOnline) await syncOfflineQueue();
  };

  // Receipt Operations
  const saveReceipt = async (receipt: FactoryReceipt) => {
    if (currentUser.role === 'supervisor') {
      throw new Error('Unauthorized: Supervisors cannot record factory receipts.');
    }
    receipt.updatedAt = new Date().toISOString();
    receipt.cloudSyncReady = true;
    await dbService.put('receipts', receipt);
    await dbService.logAudit(
      currentUser.name,
      currentUser.role,
      'SAVE_RECEIPT',
      'FactoryReceipt',
      receipt.id,
      `Recorded factory receipt #${receipt.receiptNumber} for ${receipt.factoryName} (Amount: LKR ${receipt.amount})`
    );
    await reloadData();
    if (isOnline) await syncOfflineQueue();
    await dbService.triggerMirrorBackup();
    setLastBackupTime(new Date().toLocaleTimeString());
  };

  const saveBoardingLocation = async (location: BoardingLocation) => {
    if (currentUser.role !== 'admin') {
      throw new Error('Unauthorized: Only Administrators can configure boarding locations.');
    }
    location.updatedAt = new Date().toISOString();
    location.cloudSyncReady = true;
    await dbService.put('boarding_locations', location);
    await dbService.logAudit(
      currentUser.name,
      currentUser.role,
      'SAVE_BOARDING_LOCATION',
      'BoardingLocation',
      location.id,
      `Saved boarding location "${location.name}" (Rate: LKR ${location.dailyRate}/day)`
    );
    await reloadData();
    if (isOnline) await syncOfflineQueue();
    await dbService.triggerMirrorBackup();
    setLastBackupTime(new Date().toLocaleTimeString());
  };

  const resetDatabase = async () => {
    const stores = [
      'users',
      'factories',
      'employees',
      'attendance',
      'payroll_runs',
      'employee_payments',
      'invoices',
      'receipts',
      'boarding_locations',
      'audit_logs',
      'offline_queue',
    ];
    for (const store of stores) {
      await dbService.clear(store);
    }
    window.location.reload();
  };

  const exportBackupJson = async (): Promise<string> => {
    const payload = await dbService.exportFullBackupPayload();
    return JSON.stringify(payload, null, 2);
  };

  const downloadForeverBackup = async () => {
    const payload = await dbService.exportFullBackupPayload();
    const { ForeverStorageService } = await import('../db/foreverStorage');
    ForeverStorageService.downloadBackupFile(payload);
    setLastBackupTime(new Date().toLocaleTimeString());
  };

  const restoreFromForeverMirror = async (): Promise<boolean> => {
    const { ForeverStorageService } = await import('../db/foreverStorage');
    const mirror = ForeverStorageService.getMirrorSnapshot();
    if (!mirror || !mirror.data) return false;
    await dbService.restoreFromPayload(mirror);
    await reloadData();
    if (isOnline) await syncOfflineQueue();
    setLastBackupTime(new Date().toLocaleTimeString());
    return true;
  };

  const importBackupJson = async (jsonData: string) => {
    const parsed = JSON.parse(jsonData);
    if (parsed.data) {
      await dbService.restoreFromPayload(parsed);
    } else {
      // legacy format fallback
      if (parsed.factories) {
        for (const f of parsed.factories) await dbService.put('factories', f);
      }
      if (parsed.employees) {
        for (const e of parsed.employees) await dbService.put('employees', e);
      }
      if (parsed.attendance) {
        for (const a of parsed.attendance) await dbService.put('attendance', a);
      }
      if (parsed.payroll_runs) {
        for (const p of parsed.payroll_runs) await dbService.put('payroll_runs', p);
      }
      if (parsed.employee_payments) {
        for (const pay of parsed.employee_payments) await dbService.put('employee_payments', pay);
      }
      if (parsed.invoices) {
        for (const inv of parsed.invoices) await dbService.put('invoices', inv);
      }
      if (parsed.receipts) {
        for (const r of parsed.receipts) await dbService.put('receipts', r);
      }
    }
    await reloadData();
    if (isOnline) await syncOfflineQueue();
    await dbService.triggerMirrorBackup();
    setLastBackupTime(new Date().toLocaleTimeString());
  };

  const t = translations[language];

  return (
    <AppContext.Provider
      value={{
        currentUser,
        allUsers,
        setCurrentUser,
        language,
        setLanguage,
        t,
        isOnline,
        toggleOnlineStatus,
        pendingSyncCount,
        syncOfflineQueue,
        factories,
        employees,
        attendance,
        payrollRuns,
        payments,
        invoices,
        receipts,
        boardingLocations,
        auditLogs,
        reloadData,
        saveFactory,
        saveEmployee,
        saveAttendance,
        batchSaveAttendance,
        approveAttendanceOT,
        savePayrollRun,
        savePayment,
        saveInvoice,
        saveReceipt,
        saveBoardingLocation,
        resetDatabase,
        exportBackupJson,
        importBackupJson,
        downloadForeverBackup,
        restoreFromForeverMirror,
        lastBackupTime,
        theme,
        setTheme,
        mobileFrameMode,
        setMobileFrameMode,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
