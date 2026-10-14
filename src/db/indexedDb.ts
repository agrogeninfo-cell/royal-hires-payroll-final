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

const DB_NAME = 'LankaManpowerDB_v2';
const DB_VERSION = 1;

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

  // Idempotent additions for named client factories. These records are intentionally
  // inactive and carry zero rates until an administrator configures approved rate
  // sheets; this prevents demo/guessed rates from entering payroll or invoices.
  private async ensureRequiredFactoryRecords(): Promise<void> {
    const existing = await this.getAll<Factory>('factories');
    const requiredFactories: Factory[] = [
      {
        id: 'fac-empire-teas',
        code: 'FAC-EMPIRE-TEAS',
        name: 'Empire Teas',
        address: '',
        contactPerson: 'Rate configuration required',
        contactPhone: '',
        active: false,
        invoicePeriod: 'weekly',
        shifts: [
          { id: 'empire-day', name: 'Day Shift', startTime: '08:00', endTime: '17:00', standardHours: 8 },
          { id: 'empire-night', name: 'Night Shift', startTime: '19:00', endTime: '04:00', standardHours: 8 },
        ],
        overtimeEnabled: false,
        employeeOvertimeRateHourly: 0,
        factoryOvertimeRateHourly: 0,
        billingMethod: 'SAME_RATE_FOR_ALL',
        sameRate: 0,
        billingEffectiveFrom: '2026-10-14',
        breakfastRate: 0,
        lunchRate: 0,
        dinnerRate: 0,
        supervisorIds: [],
        createdAt: '2026-10-14T00:00:00.000Z',
        updatedAt: '2026-10-14T00:00:00.000Z',
      },
      {
        id: 'fac-millennium-teas',
        code: 'FAC-MILLENNIUM-TEAS',
        name: 'Millennium Teas',
        address: '',
        contactPerson: 'Rate configuration required',
        contactPhone: '',
        active: false,
        invoicePeriod: 'weekly',
        shifts: [
          { id: 'millennium-day', name: 'Day Shift', startTime: '08:00', endTime: '17:00', standardHours: 8 },
          { id: 'millennium-night', name: 'Night Shift', startTime: '19:00', endTime: '04:00', standardHours: 8 },
        ],
        overtimeEnabled: false,
        employeeOvertimeRateHourly: 0,
        factoryOvertimeRateHourly: 0,
        billingMethod: 'SAME_RATE_FOR_ALL',
        sameRate: 0,
        billingEffectiveFrom: '2026-10-14',
        breakfastRate: 0,
        lunchRate: 0,
        dinnerRate: 0,
        supervisorIds: [],
        createdAt: '2026-10-14T00:00:00.000Z',
        updatedAt: '2026-10-14T00:00:00.000Z',
      },
    ];

    for (const factory of requiredFactories) {
      const alreadyExists = existing.some(
        (saved) => saved.id === factory.id || saved.name.trim().toLowerCase() === factory.name.toLowerCase()
      );
      if (!alreadyExists) {
        await this.put('factories', factory);
      }
    }
  }

  // Data Seeding & Auto-Recovery
  private async seedInitialDataIfNeeded(): Promise<void> {
    const factories = await this.getAll<Factory>('factories');
    if (factories.length > 0) return; // already seeded

    // Check if a Forever Mirror snapshot exists in LocalStorage
    const mirror = ForeverStorageService.getMirrorSnapshot();
    if (mirror && mirror.data && mirror.data.factories && mirror.data.factories.length > 0) {
      console.log('Restoring data from Forever LocalStorage Mirror...');
      await this.restoreFromPayload(mirror);
      return;
    }

    console.log('Seeding initial Sri Lankan Manpower business data...');

    // Users
    const users: User[] = [
      {
        id: 'usr-admin',
        name: 'Pradeep Silva',
        email: 'admin@lankamanpower.lk',
        role: 'admin',
        phone: '+94 77 123 4567',
        active: true,
      },
      {
        id: 'usr-office',
        name: 'Nimesha Perera',
        email: 'office@lankamanpower.lk',
        role: 'office_staff',
        phone: '+94 71 987 6543',
        active: true,
      },
      {
        id: 'usr-sup-kelani',
        name: 'Chandana Fernando (Supervisor)',
        email: 'sup.kelani@lankamanpower.lk',
        role: 'supervisor',
        phone: '+94 76 555 1234',
        assignedFactoryIds: ['fac-kelani'],
        active: true,
      },
      {
        id: 'usr-sup-biyagama',
        name: 'Mahinda Bandara (Supervisor)',
        email: 'sup.biyagama@lankamanpower.lk',
        role: 'supervisor',
        phone: '+94 72 444 9876',
        assignedFactoryIds: ['fac-biyagama'],
        active: true,
      },
    ];
    for (const u of users) await this.put('users', u);

    // Boarding Locations
    const boardingLocations: BoardingLocation[] = [
      {
        id: 'board-01',
        name: 'Kelaniya Agency Quarters',
        address: 'No. 45, Station Road, Kelaniya',
        contactPhone: '+94 11 291 0001',
        dailyRate: 350,
        active: true,
      },
      {
        id: 'board-02',
        name: 'Biyagama Free Trade Zone Hostel',
        address: 'Zone 1 Road, Biyagama Export Processing Zone',
        contactPhone: '+94 11 248 8899',
        dailyRate: 400,
        active: true,
      },
    ];
    for (const b of boardingLocations) await this.put('boarding_locations', b);

    // Factories with independent Billing Methods
    // Factory A: SAME_RATE_FOR_ALL (LKR 3,000)
    // Factory B: SEPARATE_MALE_FEMALE_RATES (Male LKR 3,200, Female LKR 2,900)
    // Factory C: SAME_RATE_FOR_ALL (LKR 3,400)
    const initialFactories: Factory[] = [
      {
        id: 'fac-kelani',
        code: 'FAC-KELANI',
        name: 'Kelani Textiles PLC',
        address: 'Industrial Estate, Kelaniya',
        contactPerson: 'Mr. Rohan Gunasekara (Factory Manager)',
        contactPhone: '+94 11 291 5566',
        active: true,
        invoicePeriod: 'weekly',
        shifts: [
          { id: 'sh-1', name: 'Morning Shift', startTime: '07:00', endTime: '15:30', standardHours: 8 },
          { id: 'sh-2', name: 'Night Shift', startTime: '19:00', endTime: '03:30', standardHours: 8 },
        ],
        overtimeEnabled: true,
        employeeOvertimeRateHourly: 350, // Worker gets LKR 350/hr
        factoryOvertimeRateHourly: 500,  // Factory is billed LKR 500/hr
        billingMethod: 'SAME_RATE_FOR_ALL',
        sameRate: 3000, // LKR 3,000 for all helpers
        billingEffectiveFrom: '2026-01-01',
        breakfastRate: 150,
        lunchRate: 250,
        dinnerRate: 200,
        supervisorIds: ['usr-sup-kelani'],
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T08:00:00Z',
      },
      {
        id: 'fac-biyagama',
        code: 'FAC-BIYAGAMA',
        name: 'Biyagama Packaging Ltd',
        address: 'Block B, Biyagama EPZ, Malwana',
        contactPerson: 'Ms. Nelum Jayawardena (HR Lead)',
        contactPhone: '+94 11 246 7711',
        active: true,
        invoicePeriod: 'weekly',
        shifts: [
          { id: 'sh-3', name: 'General Shift', startTime: '08:00', endTime: '17:00', standardHours: 8 },
        ],
        overtimeEnabled: true,
        employeeOvertimeRateHourly: 400,
        factoryOvertimeRateHourly: 550,
        billingMethod: 'SEPARATE_MALE_FEMALE_RATES',
        maleRate: 3200,   // Male Helper: LKR 3,200
        femaleRate: 2900, // Female Helper: LKR 2,900
        billingEffectiveFrom: '2026-01-01',
        breakfastRate: 140,
        lunchRate: 240,
        dinnerRate: 220,
        supervisorIds: ['usr-sup-biyagama'],
        createdAt: '2026-01-01T08:00:00Z',
        updatedAt: '2026-01-01T08:00:00Z',
      },
      {
        id: 'fac-katunayake',
        code: 'FAC-KATUNAYAKE',
        name: 'Katunayake Garments Exports',
        address: 'Phase II, Katunayake FTZ',
        contactPerson: 'Mr. Sunil Weerasinghe',
        contactPhone: '+94 31 223 9012',
        active: true,
        invoicePeriod: 'biweekly',
        shifts: [
          { id: 'sh-4', name: 'Day Shift', startTime: '08:00', endTime: '17:00', standardHours: 8 },
        ],
        overtimeEnabled: true,
        employeeOvertimeRateHourly: 380,
        factoryOvertimeRateHourly: 520,
        billingMethod: 'SAME_RATE_FOR_ALL',
        sameRate: 3400,
        billingEffectiveFrom: '2026-02-01',
        breakfastRate: 150,
        lunchRate: 260,
        dinnerRate: 220,
        supervisorIds: [],
        createdAt: '2026-02-01T08:00:00Z',
        updatedAt: '2026-02-01T08:00:00Z',
      },
    ];
    for (const f of initialFactories) await this.put('factories', f);

    // Initial Billing Rate History records
    const billingRateHistory: FactoryBillingRateHistory[] = [
      {
        id: 'brh-1',
        factoryId: 'fac-kelani',
        method: 'SAME_RATE_FOR_ALL',
        sameRate: 3000,
        effectiveStart: '2026-01-01',
        active: true,
        createdBy: 'usr-admin',
        createdAt: '2026-01-01T08:00:00Z',
      },
      {
        id: 'brh-2',
        factoryId: 'fac-biyagama',
        method: 'SEPARATE_MALE_FEMALE_RATES',
        maleRate: 3200,
        femaleRate: 2900,
        effectiveStart: '2026-01-01',
        active: true,
        createdBy: 'usr-admin',
        createdAt: '2026-01-01T08:00:00Z',
      },
      {
        id: 'brh-3',
        factoryId: 'fac-katunayake',
        method: 'SAME_RATE_FOR_ALL',
        sameRate: 3400,
        effectiveStart: '2026-02-01',
        active: true,
        createdBy: 'usr-admin',
        createdAt: '2026-02-01T08:00:00Z',
      },
    ];
    for (const brh of billingRateHistory) await this.put('billing_rate_history', brh);

    // Employees (All fixed designation: "Helper", no job categories!)
    const initialEmployees: Employee[] = [
      {
        id: 'EMP-101',
        fullName: 'Kasun Bandara',
        nic: '199512345678',
        phone: '+94 77 345 6789',
        address: 'No. 12, Temple Rd, Gampaha',
        gender: 'male',
        emergencyContact: 'Kumari Bandara (+94 77 999 8881)',
        startDate: '2026-01-10',
        status: 'active',
        designation: 'Helper',
        currentFactoryId: 'fac-kelani',
        wageArrangement: 'daily',
        wageRate: 2200, // Employee gets LKR 2,200/day
        eligibleForMeals: true,
        eligibleForBoarding: true,
        boardingLocationId: 'board-01',
        notes: 'Assigned to Kelani Textiles loading section',
        createdAt: '2026-01-10T08:00:00Z',
        updatedAt: '2026-01-10T08:00:00Z',
      },
      {
        id: 'EMP-102',
        fullName: 'Sunethra Silva',
        nic: '926543210V',
        phone: '+94 71 223 3445',
        address: 'No. 88, Kandy Rd, Kiribathgoda',
        gender: 'female',
        emergencyContact: 'N. Silva (+94 71 888 1234)',
        startDate: '2026-01-15',
        status: 'active',
        designation: 'Helper',
        currentFactoryId: 'fac-kelani',
        wageArrangement: 'daily',
        wageRate: 2200,
        eligibleForMeals: true,
        eligibleForBoarding: false,
        notes: 'Daily helper',
        createdAt: '2026-01-15T08:00:00Z',
        updatedAt: '2026-01-15T08:00:00Z',
      },
      {
        id: 'EMP-103',
        fullName: 'Ruwan Fernando',
        nic: '198822334455',
        phone: '+94 76 887 7665',
        address: 'No. 34, Ferry Rd, Kelaniya',
        gender: 'male',
        emergencyContact: 'M. Fernando (+94 76 111 2233)',
        startDate: '2026-02-01',
        status: 'active',
        designation: 'Helper',
        currentFactoryId: 'fac-biyagama',
        wageArrangement: 'daily',
        wageRate: 2300,
        eligibleForMeals: true,
        eligibleForBoarding: true,
        boardingLocationId: 'board-02',
        notes: 'Biyagama warehouse helper',
        createdAt: '2026-02-01T08:00:00Z',
        updatedAt: '2026-02-01T08:00:00Z',
      },
      {
        id: 'EMP-104',
        fullName: 'Dilani Jayasinghe',
        nic: '199876543210',
        phone: '+94 72 334 4556',
        address: 'No. 5, Station View, Biyagama',
        gender: 'female',
        emergencyContact: 'A. Jayasinghe (+94 72 900 1122)',
        startDate: '2026-02-05',
        status: 'active',
        designation: 'Helper',
        currentFactoryId: 'fac-biyagama',
        wageArrangement: 'daily',
        wageRate: 2150,
        eligibleForMeals: true,
        eligibleForBoarding: true,
        boardingLocationId: 'board-02',
        notes: 'Biyagama packing helper',
        createdAt: '2026-02-05T08:00:00Z',
        updatedAt: '2026-02-05T08:00:00Z',
      },
      {
        id: 'EMP-105',
        fullName: 'Chaminda Rathnayake',
        nic: '852233445V',
        phone: '+94 75 123 9876',
        address: 'No. 19, Main Street, Katunayake',
        gender: 'male',
        emergencyContact: 'D. Rathnayake (+94 75 444 3322)',
        startDate: '2026-02-10',
        status: 'active',
        designation: 'Helper',
        currentFactoryId: 'fac-katunayake',
        wageArrangement: 'daily',
        wageRate: 2400,
        eligibleForMeals: true,
        eligibleForBoarding: false,
        notes: 'Katunayake garments helper',
        createdAt: '2026-02-10T08:00:00Z',
        updatedAt: '2026-02-10T08:00:00Z',
      },
      {
        id: 'EMP-106',
        fullName: 'Kamani Wijesinghe',
        nic: '199366554433',
        phone: '+94 78 998 7766',
        address: 'No. 40, School Lane, Biyagama',
        gender: 'female',
        emergencyContact: 'S. Wijesinghe (+94 78 333 4455)',
        startDate: '2026-02-12',
        status: 'active',
        designation: 'Helper',
        currentFactoryId: 'fac-biyagama',
        wageArrangement: 'daily',
        wageRate: 2150,
        eligibleForMeals: true,
        eligibleForBoarding: false,
        notes: 'Biyagama assembly helper',
        createdAt: '2026-02-12T08:00:00Z',
        updatedAt: '2026-02-12T08:00:00Z',
      },
    ];
    for (const e of initialEmployees) await this.put('employees', e);

    // Initial Attendance records (yesterday and today for testing)
    const today = new Date().toISOString().split('T')[0];
    const initialAttendance: AttendanceRecord[] = [
      {
        id: `att-101-${today}`,
        employeeId: 'EMP-101',
        employeeName: 'Kasun Bandara',
        employeeGender: 'male',
        factoryId: 'fac-kelani',
        factoryName: 'Kelani Textiles PLC',
        date: today,
        shift: 'Morning Shift',
        status: 'present',
        payableUnits: 1.0,
        otHours: 2,
        otMinutes: 0,
        totalOtHours: 2.0,
        hadBreakfast: true,
        hadLunch: true,
        hadDinner: false,
        hadBoarding: true,
        recordedBy: 'usr-sup-kelani',
        supervisorName: 'Chandana Fernando (Supervisor)',
        submissionStatus: 'approved',
        billable: true,
        approvedBy: 'usr-admin',
        approvedAt: new Date().toISOString(),
        syncStatus: 'synced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `att-102-${today}`,
        employeeId: 'EMP-102',
        employeeName: 'Sunethra Silva',
        employeeGender: 'female',
        factoryId: 'fac-kelani',
        factoryName: 'Kelani Textiles PLC',
        date: today,
        shift: 'Morning Shift',
        status: 'present',
        payableUnits: 1.0,
        otHours: 1,
        otMinutes: 30, // 1 hr 30 mins = 1.5 hrs
        totalOtHours: 1.5,
        hadBreakfast: false,
        hadLunch: true,
        hadDinner: false,
        hadBoarding: false,
        recordedBy: 'usr-sup-kelani',
        supervisorName: 'Chandana Fernando (Supervisor)',
        submissionStatus: 'approved',
        billable: true,
        approvedBy: 'usr-admin',
        approvedAt: new Date().toISOString(),
        syncStatus: 'synced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `att-103-${today}`,
        employeeId: 'EMP-103',
        employeeName: 'Ruwan Fernando',
        employeeGender: 'male',
        factoryId: 'fac-biyagama',
        factoryName: 'Biyagama Packaging Ltd',
        date: today,
        shift: 'General Shift',
        status: 'present',
        payableUnits: 1.0,
        otHours: 3,
        otMinutes: 0,
        totalOtHours: 3.0,
        hadBreakfast: true,
        hadLunch: true,
        hadDinner: true,
        hadBoarding: true,
        recordedBy: 'usr-sup-biyagama',
        supervisorName: 'Mahinda Bandara (Supervisor)',
        submissionStatus: 'submitted', // Awaiting Admin OT approval
        billable: false,
        syncStatus: 'synced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: `att-104-${today}`,
        employeeId: 'EMP-104',
        employeeName: 'Dilani Jayasinghe',
        employeeGender: 'female',
        factoryId: 'fac-biyagama',
        factoryName: 'Biyagama Packaging Ltd',
        date: today,
        shift: 'General Shift',
        status: 'present',
        payableUnits: 1.0,
        otHours: 2,
        otMinutes: 0,
        totalOtHours: 2.0,
        hadBreakfast: true,
        hadLunch: true,
        hadDinner: false,
        hadBoarding: true,
        recordedBy: 'usr-sup-biyagama',
        supervisorName: 'Mahinda Bandara (Supervisor)',
        submissionStatus: 'submitted',
        billable: false,
        syncStatus: 'synced',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    for (const a of initialAttendance) await this.put('attendance', a);

    // Initial Employee Advance
    const initialAdvance: EmployeePayment = {
      id: 'ADV-101',
      employeeId: 'EMP-101',
      employeeName: 'Kasun Bandara',
      paymentType: 'advance',
      amount: 2000,
      paymentDate: today,
      paymentMethod: 'cash',
      referenceNumber: 'VOUCH-0091',
      notes: 'Mid-week salary advance requested by employee',
      recordedBy: 'usr-office',
      createdAt: new Date().toISOString(),
    };
    await this.put('employee_payments', initialAdvance);

    // Initial Audit Log
    await this.logAudit(
      'System Initializer',
      'admin',
      'INITIALIZE_DATABASE',
      'System',
      'ROOT',
      'Seeded initial Sri Lankan factories (Kelani Textiles, Biyagama Packaging, Katunayake Garments) and Helpers.'
    );

    // Initial Mirror Snapshot Save
    await this.triggerMirrorBackup();
  }

  // FOREVER STORAGE METHODS
  public async exportFullBackupPayload(): Promise<SystemBackupPayload> {
    await this.init();
    const [users, factories, employees, attendance, payroll_runs, employee_payments, invoices, receipts, boarding_locations, billing_rate_history, audit_logs] =
      await Promise.all([
        this.getAll<User>('users'),
        this.getAll<Factory>('factories'),
        this.getAll<Employee>('employees'),
        this.getAll<AttendanceRecord>('attendance'),
        this.getAll<PayrollRun>('payroll_runs'),
        this.getAll<EmployeePayment>('employee_payments'),
        this.getAll<FactoryInvoice>('invoices'),
        this.getAll<FactoryReceipt>('receipts'),
        this.getAll<BoardingLocation>('boarding_locations'),
        this.getAll<FactoryBillingRateHistory>('billing_rate_history'),
        this.getAll<AuditLog>('audit_logs'),
      ]);

    const payload: SystemBackupPayload = {
      version: '2.4.0',
      timestamp: new Date().toISOString(),
      recordsCount: {
        users: users.length,
        factories: factories.length,
        employees: employees.length,
        attendance: attendance.length,
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
