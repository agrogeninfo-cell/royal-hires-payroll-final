import { dbService } from '../db/indexedDb';
import { ForeverStorageService } from '../db/foreverStorage';
import { getCurrentSession, getSupabaseClient, loadAccessProfile } from './authService';
import { SyncService } from './syncService';

type RecordRow = Record<string, any> & { id: string };
export type MigrationCollection =
  | 'employees' | 'attendance' | 'overtime' | 'payroll_runs'
  | 'employee_payments' | 'invoices' | 'receipts'
  | 'boarding_locations' | 'billing_rate_history';

export interface LegacyMigrationCandidate {
  collection: MigrationCollection;
  id: string;
  label: string;
  details: string;
}
export interface LegacyMigrationPreview {
  factoryNames: string[];
  candidates: LegacyMigrationCandidate[];
  skipped: Record<string, number>;
}
export interface LegacyMigrationResult {
  selected: number;
  pushedCount: number;
  pulledCount: number;
  conflictCount: number;
  failedCount: number;
  errors: string[];
}

const COLLECTION_MAP: Record<MigrationCollection, string> = {
  employees: 'employees',
  attendance: 'attendance',
  overtime: 'overtime',
  payroll_runs: 'payroll_runs',
  employee_payments: 'employee_payments',
  invoices: 'invoices',
  receipts: 'receipts',
  boarding_locations: 'boarding_locations',
  billing_rate_history: 'billing_rate_history',
};
const TARGET_NAMES = new Set(['empire teas', 'millennium teas']);
const money = (n: unknown) => 'LKR ' + Number(n || 0).toLocaleString('en-LK');

async function requireAdmin() {
  const session = await getCurrentSession();
  if (!session?.user?.id) throw new Error('Sign in as an approved administrator to migrate existing records.');
  const access = await loadAccessProfile(session.user.id);
  if (!access || access.user.role !== 'admin' || !access.user.active || access.approvalStatus !== 'approved') {
    throw new Error('Only an approved, active Admin may review and migrate legacy records.');
  }
  return { session, access, supabase: getSupabaseClient() };
}

function candidateDetails(collection: MigrationCollection, row: RecordRow): LegacyMigrationCandidate {
  const label = collection === 'employees' ? String(row.fullName || row.id)
    : collection === 'attendance' ? String(row.employeeName || row.employeeId || row.id)
    : collection === 'overtime' ? String(row.employeeName || row.employeeId || row.id)
    : collection === 'payroll_runs' ? String(row.payrollNumber || row.id)
    : collection === 'employee_payments' ? String(row.employeeName || row.employeeId || row.id)
    : collection === 'invoices' ? String(row.invoiceNumber || row.id)
    : collection === 'receipts' ? String(row.receiptNumber || row.id)
    : collection === 'boarding_locations' ? String(row.name || row.id)
    : String(row.factoryName || row.factoryId || row.id);
  const details = collection === 'employees'
    ? 'ID ' + row.id + ' · ' + String(row.currentFactoryId || 'factory unassigned')
    : collection === 'attendance'
      ? String(row.date || 'date unknown') + ' · ' + String(row.factoryName || row.factoryId || '') + ' · ' + String(row.status || '')
      : collection === 'overtime'
        ? String(row.date || 'date unknown') + ' · ' + String(row.totalOtHours ?? row.otHours ?? 0) + ' OT hours'
        : collection === 'payroll_runs'
          ? String(row.periodStart || '?') + ' – ' + String(row.periodEnd || '?') + ' · Net ' + money(row.totalNet)
          : collection === 'employee_payments'
            ? String(row.paymentDate || '?') + ' · ' + money(row.amount)
            : collection === 'invoices'
              ? String(row.periodStart || '?') + ' – ' + String(row.periodEnd || '?') + ' · ' + money(row.totalAmount)
              : collection === 'receipts'
                ? String(row.receiptDate || '?') + ' · ' + money(row.amount)
                : collection === 'boarding_locations'
                  ? String(row.address || '') + ' · ' + money(row.dailyRate) + '/day'
                  : String(row.effectiveStart || '?') + ' · rate history';
  return { collection, id: row.id, label, details };
}

export async function previewLegacyCloudMigration(): Promise<LegacyMigrationPreview> {
  const { access, supabase } = await requireAdmin();
  const factories = await dbService.getAll<RecordRow>('factories');
  const targetFactories = factories.filter(f => TARGET_NAMES.has(String(f.name || '').trim().toLowerCase()));
  const targetFactoryIds = new Set(targetFactories.map(f => f.id));
  const employees = await dbService.getAll<RecordRow>('employees');
  const targetEmployees = employees.filter(e => targetFactoryIds.has(e.currentFactoryId));
  const targetEmployeeIds = new Set(targetEmployees.map(e => e.id));
  const targetBoardingIds = new Set(targetEmployees.map(e => e.boardingLocationId).filter(Boolean));
  const [attendance, overtime, payrollRuns, payments, invoices, receipts, boarding, rateHistory] = await Promise.all([
    dbService.getAll<RecordRow>('attendance'),
    dbService.getAll<RecordRow>('overtime'),
    dbService.getAll<RecordRow>('payroll_runs'),
    dbService.getAll<RecordRow>('employee_payments'),
    dbService.getAll<RecordRow>('invoices'),
    dbService.getAll<RecordRow>('receipts'),
    dbService.getAll<RecordRow>('boarding_locations'),
    dbService.getAll<RecordRow>('billing_rate_history'),
  ]);
  const local: Record<MigrationCollection, RecordRow[]> = {
    employees: targetEmployees,
    attendance: attendance.filter(r => targetFactoryIds.has(r.factoryId)),
    overtime: overtime.filter(r => targetFactoryIds.has(r.factoryId)),
    payroll_runs: payrollRuns.filter(r => Array.isArray(r.items) && r.items.length > 0 && r.items.every((item: any) => targetFactoryIds.has(item.factoryId))),
    employee_payments: payments.filter(r => targetEmployeeIds.has(r.employeeId)),
    invoices: invoices.filter(r => targetFactoryIds.has(r.factoryId)),
    receipts: receipts.filter(r => targetFactoryIds.has(r.factoryId)),
    boarding_locations: boarding.filter(r => targetBoardingIds.has(r.id)),
    billing_rate_history: rateHistory.filter(r => targetFactoryIds.has(r.factoryId)),
  };
  const candidates: LegacyMigrationCandidate[] = [];
  const skipped: Record<string, number> = {};
  for (const [collection, rows] of Object.entries(local) as [MigrationCollection, RecordRow[]][]) {
    const { data, error } = await supabase.from('app_records').select('record_id')
      .eq('company_id', access.companyId).eq('collection_name', COLLECTION_MAP[collection]);
    if (error) throw new Error('Could not inspect cloud ' + collection + ' records: ' + error.message);
    const cloudIds = new Set((data || []).map((row: { record_id: string }) => row.record_id));
    let alreadyInCloud = 0;
    for (const row of rows) {
      if (cloudIds.has(row.id)) { alreadyInCloud++; continue; }
      candidates.push(candidateDetails(collection, row));
    }
    skipped[collection] = alreadyInCloud;
  }
  return { factoryNames: targetFactories.map(f => f.name), candidates, skipped };
}

/**
 * Explicit, admin-reviewed migration of selected legacy records. Creates a local mirror
 * backup first, only adds missing cloud rows, and never deletes or rewrites business values.
 */
export async function migrateSelectedLegacyRecords(
  selected: Partial<Record<MigrationCollection, string[]>>
): Promise<LegacyMigrationResult> {
  const { access } = await requireAdmin();
  const preview = await previewLegacyCloudMigration();
  const candidateKeys = new Set(preview.candidates.map(item => item.collection + ':' + item.id));
  const selectedPairs = Object.entries(selected).flatMap(([collection, ids]) =>
    (ids || []).map(id => ({ collection: collection as MigrationCollection, id }))
  );
  if (!selectedPairs.length) throw new Error('Select at least one record to migrate.');
  for (const item of selectedPairs) {
    if (!candidateKeys.has(item.collection + ':' + item.id)) {
      throw new Error('A selected record is no longer eligible or already exists in cloud. Refresh the preview and review again.');
    }
  }

  const backup = await dbService.exportFullBackupPayload();
  ForeverStorageService.saveMirrorSnapshot(backup);
  const stores = new Set(selectedPairs.map(item => item.collection));
  const selectedIds = new Map<MigrationCollection, Set<string>>();
  for (const item of selectedPairs) {
    if (!selectedIds.has(item.collection)) selectedIds.set(item.collection, new Set());
    selectedIds.get(item.collection)!.add(item.id);
  }

  for (const collection of stores) {
    const ids = selectedIds.get(collection)!;
    const rows = await dbService.getAll<RecordRow>(collection);
    for (const row of rows) {
      if (!ids.has(row.id)) continue;
      // Cloud metadata only; salary, attendance, invoice and receipt values are untouched.
      await dbService.put(collection, { ...row, updatedAt: row.updatedAt || new Date().toISOString(), cloudSyncReady: true });
    }
  }

  const sync = await SyncService.processQueue();
  return {
    selected: selectedPairs.length,
    pushedCount: sync.pushedCount,
    pulledCount: sync.pulledCount,
    conflictCount: sync.conflictCount,
    failedCount: sync.failedCount,
    errors: sync.errors,
  };
}
