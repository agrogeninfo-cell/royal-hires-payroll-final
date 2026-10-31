import {
  User,
  Factory,
  Employee,
  AttendanceRecord,
  OvertimeSubmission,
  PayrollRun,
  EmployeePayment,
  FactoryInvoice,
  FactoryReceipt,
  BoardingLocation,
  FactoryBillingRateHistory,
  AuditLog,
  OfflineQueueItem,
} from '../types';
import { ForeverStorageService, SystemBackupPayload } from './foreverStorage';

const DB_NAME = import.meta.env?.VITE_PUBLIC_DEMO_MODE === 'true' ? 'RoyalPay_PublicDemo_v1' : 'LankaManpowerDB_v2';
const DB_VERSION = 1;

/**
 * Return only required factory defaults that are absent from saved data.
 * This helper deliberately never mutates saved factory records or their settings.
 */
export function getMissingRequiredFactories(existing: Factory[], defaults: Factory[]): Factory[] {
  return defaults.filter(
    (base) => !existing.some(
      (item) => item.id === base.id || item.name.trim().toLowerCase() === base.name.trim().toLowerCase()
    )
  );
}

export class DatabaseService {
  private db: IDBDatabase | null = null;
  private isInitialized = false;

  public async init(): Promise<void> {
    if (this.isInitialized && this.db) return;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('IndexedDB not supported in current environment. Using memory fallback.');
        this.isInitialized = true;
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create stores if they do not exist
        const stores = [
          'users',
          'factories',
          'employees',
          'attendance',
          'overtime',
          'payroll_runs',
          'employee_payments',
          'invoices',
          'receipts',
          'boarding_locations',
          'billing_rate_history',
          'audit_logs',
          'offline_queue',
        ];

        stores.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        });
      };

      request.onsuccess = async (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitialized = true;
        await this.seedInitialDataIfNeeded();
        await this.ensureRequiredFactoryRecords();
        resolve();
      };

      request.onerror = (event) => {
        console.error('IndexedDB error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  // Generic helpers
  public async getAll<T>(storeName: string): Promise<T[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  public async getById<T>(storeName: string, id: string): Promise<T | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve((request.result as T) || null);
      request.onerror = () => reject(request.error);
    });
  }

  public async put<T extends { id: string }>(storeName: string, item: T): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async delete(storeName: string, id: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async clear(storeName: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Audit Logging
  public async logAudit(
    actor: string,
    actorRole: any,
    action: string,
    entityType: string,
    entityId: string,
    details: string,
    beforeValues?: any,
    afterValues?: any
  ): Promise<void> {
    const auditItem: AuditLog = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      cloudSyncReady: true,
      actor,
      actorRole,
      action,
      entityType,
      entityId,
      details,
      beforeValues,
      afterValues,
    };
    await this.put('audit_logs', auditItem);
  }

  // Offline queue operations
  public async enqueueOffline(
    operationType: OfflineQueueItem['operationType'],
    payload: any
  ): Promise<OfflineQueueItem> {
    const queueItem: OfflineQueueItem = {
      id: `OFFLINE-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      operationType,
      payload,
      clientTimestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };
    await this.put('offline_queue', queueItem);
    return queueItem;
  }

  public async getOfflineQueue(): Promise<OfflineQueueItem[]> {
    return this.getAll<OfflineQueueItem>('offline_queue');
  }

  public async removeOfflineItem(id: string): Promise<void> {
    return this.delete('offline_queue', id);
  }

  // Ensure the two approved client factories exist with rules based on the supplied business references.
  private async ensureRequiredFactoryRecords(): Promise<void> {
    const now = new Date().toISOString();
    const defaults: Factory[] = [
      {
        id: 'fac-empire-teas', code: 'FAC-EMPIRE-TEAS', name: 'Empire Teas',
        address: '', contactPerson: 'Factory contact to be configured', contactPhone: '', active: true,
        invoicePeriod: 'weekly',
        shifts: [
          { id: 'empire-day', name: 'Day Shift', startTime: '08:00', endTime: '17:00', standardHours: 8 },
          { id: 'empire-night', name: 'Night Shift', startTime: '20:30', endTime: '08:00', standardHours: 8 },
          { id: 'empire-day-night', name: 'D+N', startTime: '08:00', endTime: '08:00', standardHours: 16 },
        ],
        overtimeEnabled: true, employeeOvertimeRateHourly: 0, factoryOvertimeRateHourly: 225, sundayPoyaOvertimeRateHourly: 300, mandatoryOtHoursPerShift: 3, sundayPoyaOtHoursPerShift: 12, femaleNightAllowance: 100,
        billingMethod: 'SAME_RATE_FOR_ALL', sameRate: 1525,
        wageSameRate: 2000, wageMaleRate: 2000, wageFemaleRate: 2000,
        weekdayWage: 2000, saturdayWage: 2000, sundayPoyaWage: 2300,
        attendanceBonus: 5500, attendanceBonusDays: 21, lateDeductionPerHour: 150,
        billingEffectiveFrom: '2026-01-01', specialBillingDates: [],
        breakfastRate: 130, lunchRate: 250, dinnerRate: 250, supervisorIds: [],
        createdAt: now, updatedAt: now,
      },
      {
        id: 'fac-millennium-teas', code: 'FAC-MILLENNIUM-TEAS', name: 'Millennium Teas',
        address: '', contactPerson: 'Factory contact to be configured', contactPhone: '', active: true,
        invoicePeriod: 'monthly',
        shifts: [
          { id: 'millennium-day', name: 'Day Shift', startTime: '07:00', endTime: '19:00', standardHours: 12 },
          { id: 'millennium-night', name: 'Night Shift', startTime: '20:30', endTime: '08:00', standardHours: 11.5 },
        ],
        overtimeEnabled: true, employeeOvertimeRateHourly: 180, factoryOvertimeRateHourly: 225, sundayPoyaOvertimeRateHourly: 225, mandatoryOtHoursPerShift: 0, sundayPoyaOtHoursPerShift: 0, femaleNightAllowance: 0,
        billingMethod: 'SEPARATE_MALE_FEMALE_RATES', maleRate: 3000, femaleRate: 2500,
        wageSameRate: 0, wageMaleRate: 2500, wageFemaleRate: 2100,
        attendanceBonus: 0, attendanceBonusDays: 21, lateDeductionPerHour: 150,
        billingEffectiveFrom: '2026-01-01', specialBillingDates: [],
        breakfastRate: 130, lunchRate: 250, dinnerRate: 250, supervisorIds: [],
        createdAt: now, updatedAt: now,
      },
    ];
    const existing = await this.getAll<Factory>('factories');
    // Add only missing required factories. Existing configuration may contain
    // administrator-approved rates and must never be overwritten during startup.
    for (const missing of getMissingRequiredFactories(existing, defaults)) {
      await this.put('factories', missing);
    }
  }

  // Fresh installations do not get fabricated demo employees or attendance.
  private async seedInitialDataIfNeeded(): Promise<void> {
    const factories = await this.getAll<Factory>('factories');
    if (factories.length > 0) return;
    const mirror = ForeverStorageService.getMirrorSnapshot();
    if (mirror?.data?.factories?.length) {
      console.log('Restoring existing Royal Pay data from the local mirror.');
      await this.restoreFromPayload(mirror);
    }
  }

  // FOREVER STORAGE METHODS
  public async exportFullBackupPayload(): Promise<SystemBackupPayload> {
    await this.init();
    const [users, factories, employees, attendance, overtime, offline_queue, payroll_runs, employee_payments, invoices, receipts, boarding_locations, billing_rate_history, audit_logs] =
      await Promise.all([
        this.getAll<User>('users'),
        this.getAll<Factory>('factories'),
        this.getAll<Employee>('employees'),
        this.getAll<AttendanceRecord>('attendance'),
        this.getAll<OvertimeSubmission>('overtime'),
        this.getAll<OfflineQueueItem>('offline_queue'),
        this.getAll<PayrollRun>('payroll_runs'),
        this.getAll<EmployeePayment>('employee_payments'),
        this.getAll<FactoryInvoice>('invoices'),
        this.getAll<FactoryReceipt>('receipts'),
        this.getAll<BoardingLocation>('boarding_locations'),
        this.getAll<FactoryBillingRateHistory>('billing_rate_history'),
        this.getAll<AuditLog>('audit_logs'),
      ]);

    const payload: SystemBackupPayload = {
      version: '2.5.0',
      timestamp: new Date().toISOString(),
      recordsCount: {
        users: users.length,
        factories: factories.length,
        employees: employees.length,
        attendance: attendance.length,
        overtime: overtime.length,
        offlineQueue: offline_queue.length,
        payrollRuns: payroll_runs.length,
        payments: employee_payments.length,
        invoices: invoices.length,
        receipts: receipts.length,
        boardingLocations: boarding_locations.length,
        auditLogs: audit_logs.length,
      },
      data: {
        users,
        factories,
        employees,
        attendance,
        overtime,
        offline_queue,
        payroll_runs,
        employee_payments,
        invoices,
        receipts,
        boarding_locations,
        billing_rate_history,
        audit_logs,
      },
    };

    return payload;
  }

  public async restoreFromPayload(payload: SystemBackupPayload): Promise<void> {
    await this.init();
    if (!payload || !payload.data) {
      throw new Error('Invalid backup payload.');
    }

    const { data } = payload;
    if (Array.isArray(data.users)) {
      for (const item of data.users) await this.put('users', item);
    }
    if (Array.isArray(data.factories)) {
      for (const item of data.factories) await this.put('factories', item);
    }
    if (Array.isArray(data.employees)) {
      for (const item of data.employees) await this.put('employees', item);
    }
    if (Array.isArray(data.attendance)) {
      for (const item of data.attendance) await this.put('attendance', item);
    }
    if (Array.isArray(data.overtime)) {
      for (const item of data.overtime) await this.put('overtime', item);
    }
    if (Array.isArray(data.offline_queue)) {
      for (const item of data.offline_queue) await this.put('offline_queue', item);
    }
    if (Array.isArray(data.payroll_runs)) {
      for (const item of data.payroll_runs) await this.put('payroll_runs', item);
    }
    if (Array.isArray(data.employee_payments)) {
      for (const item of data.employee_payments) await this.put('employee_payments', item);
    }
    if (Array.isArray(data.invoices)) {
      for (const item of data.invoices) await this.put('invoices', item);
    }
    if (Array.isArray(data.receipts)) {
      for (const item of data.receipts) await this.put('receipts', item);
    }
    if (Array.isArray(data.boarding_locations)) {
      for (const item of data.boarding_locations) await this.put('boarding_locations', item);
    }
    if (Array.isArray(data.billing_rate_history)) {
      for (const item of data.billing_rate_history) await this.put('billing_rate_history', item);
    }
    if (Array.isArray(data.audit_logs)) {
      for (const item of data.audit_logs) await this.put('audit_logs', item);
    }

    // Update LocalStorage mirror immediately
    ForeverStorageService.saveMirrorSnapshot(payload);
  }

  public async triggerMirrorBackup(): Promise<void> {
    try {
      const payload = await this.exportFullBackupPayload();
      ForeverStorageService.saveMirrorSnapshot(payload);
    } catch (err) {
      console.warn('Failed to save mirror backup:', err);
    }
  }
}

export const dbService = new DatabaseService();
