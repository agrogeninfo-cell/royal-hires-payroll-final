export type UserRole = 'admin' | 'office_staff' | 'supervisor';

export type Language = 'en' | 'si';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  assignedFactoryIds?: string[]; // Supervisors only have access to these
  active: boolean;
}

export type BillingRateMethod = 'SAME_RATE_FOR_ALL' | 'SEPARATE_MALE_FEMALE_RATES';

export interface FactoryShift {
  id: string;
  name: string; // e.g. "Morning", "Night", "General"
  startTime: string; // e.g. "08:00"
  endTime: string; // e.g. "17:00"
  standardHours: number; // e.g. 8 or 9
}

export interface Factory {
  id: string;
  code: string; // e.g. "FAC-01"
  name: string;
  address: string;
  contactPerson: string;
  contactPhone: string;
  active: boolean;
  invoicePeriod: 'weekly' | 'biweekly' | 'monthly';
  shifts: FactoryShift[];
  overtimeEnabled: boolean;
  employeeOvertimeRateHourly: number; // in LKR paid to worker
  factoryOvertimeRateHourly: number; // in LKR billed to factory
  billingMethod: BillingRateMethod;
  sameRate?: number; // Standard daily billing rate for all Helpers in LKR
  maleRate?: number; // Male Helper daily rate in LKR
  femaleRate?: number; // Female Helper daily rate in LKR
  nightMaleRate?: number; // Optional Millennium Teas night-shift billing rate; blank until confirmed
  nightFemaleRate?: number; // Optional Millennium Teas night-shift billing rate; blank until confirmed
  billingEffectiveFrom: string; // YYYY-MM-DD
  billingEffectiveTo?: string; // YYYY-MM-DD
  breakfastRate: number; // LKR
  lunchRate: number; // LKR
  dinnerRate: number; // LKR
  supervisorIds: string[];
  /** Admin-maintained dates billed using the factory's Sunday/Poya special-day rule. */
  specialBillingDates?: string[];
  createdAt: string;
  updatedAt: string;
  /** True only after an explicit local create/edit approved for cloud synchronization. */
  cloudSyncReady?: boolean;
  /** True only after the cloud accepted the factory configuration payload. */
  cloudSyncConfirmed?: boolean;
}

export type WageArrangement = 'daily' | 'weekly' | 'monthly';

export interface Employee {
  id: string; // Unique Employee ID (e.g. EMP-101)
  fullName: string;
  nic: string; // Sri Lankan National Identity Card (e.g. 199012345678 or 901234567V)
  phone: string;
  address: string;
  gender: 'male' | 'female';
  emergencyContact?: string;
  startDate: string;
  status: 'active' | 'inactive' | 'resigned';
  designation: 'Helper'; // FIXED BUSINESS RULE: Always Helper. No job categories.
  currentFactoryId: string;
  wageArrangement: WageArrangement;
  wageRate: number; // Daily, Weekly, or Monthly wage rate in LKR
  eligibleForMeals: boolean;
  eligibleForBoarding: boolean;
  boardingLocationId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  /** True only after an explicit local create/edit approved for cloud synchronization. */
  cloudSyncReady?: boolean;
}

export interface EmployeeAssignmentHistory {
  id: string;
  employeeId: string;
  factoryId: string;
  factoryName: string;
  startDate: string;
  endDate?: string;
  reason?: string;
  recordedBy: string;
  createdAt: string;
}

export interface FactoryBillingRateHistory {
  id: string;
  factoryId: string;
  method: BillingRateMethod;
  sameRate?: number;
  maleRate?: number;
  femaleRate?: number;
  effectiveStart: string;
  effectiveEnd?: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  /** True only after an explicit local create/edit approved for cloud synchronization. */
  cloudSyncReady?: boolean;
}

export interface BoardingLocation {
  id: string;
  name: string;
  address: string;
  contactPhone: string;
  dailyRate: number; // LKR per day
  active: boolean;
  updatedAt?: string;
  /** True only after an explicit local create/edit approved for cloud synchronization. */
  cloudSyncReady?: boolean;
}

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'half_day';
export type SubmissionStatus = 'submitted' | 'approved' | 'rejected';
export type SyncStatus = 'synced' | 'pending' | 'conflict';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeGender: 'male' | 'female';
  factoryId: string;
  factoryName: string;
  date: string; // YYYY-MM-DD
  shift: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  payableUnits: number; // 1.0 for full day, 0.5 for half day, 0 for absent
  otHours: number; // integer hours
  otMinutes: number; // 0, 15, 30, 45, etc.
  totalOtHours: number; // otHours + (otMinutes / 60)
  lateHours?: number; // Millennium Teas late-time deduction hours, when recorded
  hadBreakfast: boolean;
  hadLunch: boolean;
  hadDinner: boolean;
  hadBoarding: boolean;
  notes?: string;
  recordedBy: string;
  supervisorName: string;
  submissionStatus: SubmissionStatus;
  billable: boolean;
  approvedBy?: string;
  approvedAt?: string;
  isOfflineCreated?: boolean;
  syncStatus: SyncStatus;
  conflictReason?: string;
  createdAt: string;
  updatedAt: string;
  /** True only after an explicit local create/edit approved for cloud synchronization. */
  cloudSyncReady?: boolean;
}

export interface OvertimeSubmission {
  id: string;
  attendanceId: string;
  employeeId: string;
  employeeName: string;
  factoryId: string;
  factoryName: string;
  date: string;
  otHours: number;
  otMinutes: number;
  totalOtHours: number;
  employeePayRateHourly: number; // snapshot from factory
  factoryBillingRateHourly: number; // snapshot from factory
  status: SubmissionStatus;
  recordedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  updatedAt?: string;
  /** True only after an explicit local create/edit approved for cloud synchronization. */
  cloudSyncReady?: boolean;
}

export interface PayrollItem {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  employeeGender: 'male' | 'female';
  factoryId: string;
  factoryName: string;
  wageArrangement: WageArrangement;
  snapshotWageRate: number; // rate used at approval time
  daysWorked: number;
  normalWage: number;
  approvedOtHours: number;
  snapshotOtRateHourly: number;
  otWage: number;
  grossEarnings: number;
  breakfastCount: number;
  breakfastCost: number;
  lunchCount: number;
  lunchCost: number;
  dinnerCount: number;
  dinnerCost: number;
  totalMealDeductions: number;
  boardingDays: number;
  boardingCost: number;
  totalBoardingDeductions: number;
  advancesDeducted: number;
  otherDeductions: number;
  totalDeductions: number;
  netPayable: number;
  amountPaid: number;
  remainingBalance: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
}

export interface PayrollRun {
  id: string;
  payrollNumber: string; // e.g. "PAY-2026-10-01"
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  status: 'draft' | 'approved' | 'paid';
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  totalPaid: number;
  totalBalance: number;
  items: PayrollItem[];
  notes?: string;
  updatedAt?: string;
  /** True only after an explicit local create/edit approved for cloud synchronization. */
  cloudSyncReady?: boolean;
}

export type PaymentType = 'advance' | 'salary_payment' | 'partial_payment';

export interface EmployeePayment {
  id: string;
  employeeId: string;
  employeeName: string;
  payrollRunId?: string; // linked if paying salary
  payrollItemId?: string;
  paymentType: PaymentType;
  amount: number;
  paymentDate: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'cheque';
  referenceNumber?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
  updatedAt?: string;
  /** True only after an explicit local create/edit approved for cloud synchronization. */
  cloudSyncReady?: boolean;
}

export interface InvoiceLineItem {
  id: string;
  attendanceId: string;
  employeeId: string;
  employeeName: string;
  employeeGender: 'male' | 'female';
  date: string;
  shift: string;
  rateMethodSnapshot: BillingRateMethod;
  snapshotBillingRate: number; // LKR
  billableDays: number; // 1.0 or 0.5
  dayBillingTotal: number;
  approvedOtHours: number;
  snapshotOtBillingRateHourly: number;
  otBillingTotal: number;
  lineTotal: number;
}

export interface FactoryInvoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-001"
  factoryId: string;
  factoryName: string;
  invoiceDate: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  adjustments: number;
  totalAmount: number;
  amountReceived: number;
  outstandingBalance: number;
  status: 'draft' | 'issued' | 'partially_paid' | 'paid' | 'cancelled';
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** True only after an explicit local create/edit approved for cloud synchronization. */
  cloudSyncReady?: boolean;
}

export interface ReceiptAllocation {
  id: string;
  receiptId: string;
  invoiceId: string;
  invoiceNumber: string;
  amountAllocated: number;
  allocatedAt: string;
  allocatedBy: string;
}

export interface FactoryReceipt {
  id: string;
  receiptNumber: string; // e.g. "RCT-2026-001"
  factoryId: string;
  factoryName: string;
  receiptDate: string;
  amount: number;
  paymentMethod: 'bank_transfer' | 'cheque' | 'cash';
  referenceNumber: string;
  notes?: string;
  unallocatedAmount: number;
  allocations: ReceiptAllocation[];
  recordedBy: string;
  createdAt: string;
  updatedAt?: string;
  /** True only after an explicit local create/edit approved for cloud synchronization. */
  cloudSyncReady?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: UserRole;
  action: string; // e.g. "UPDATE_BILLING_RATE", "APPROVE_OVERTIME", "RECORD_PAYMENT"
  entityType: string;
  entityId: string;
  details: string;
  beforeValues?: any;
  afterValues?: any;
  updatedAt?: string;
  /** True only after an explicit local create/edit approved for cloud synchronization. */
  cloudSyncReady?: boolean;
}

export interface OfflineQueueItem {
  id: string;
  operationType: 'CREATE_ATTENDANCE' | 'UPDATE_ATTENDANCE' | 'RECORD_PAYMENT';
  payload: any;
  clientTimestamp: string;
  retryCount: number;
  status: 'pending' | 'synced' | 'conflict';
  error?: string;
}
