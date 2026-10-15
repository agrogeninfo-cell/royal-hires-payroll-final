import { dbService } from '../db/indexedDb';
import { getCurrentSession, getSupabaseClient, loadAccessProfile } from './authService';

type LocalRecord = Record<string, any> & { id: string };
type RemoteRecord = { record_id: string; factory_id: string | null; payload: LocalRecord };
const COLLECTIONS = [
  ['factories', 'factory_configs'], ['employees', 'employees'], ['attendance', 'attendance'],
  ['overtime', 'overtime'], ['payroll_runs', 'payroll_runs'], ['employee_payments', 'employee_payments'],
  ['invoices', 'invoices'], ['receipts', 'receipts'], ['boarding_locations', 'boarding_locations'],
  ['billing_rate_history', 'billing_rate_history'], ['audit_logs', 'audit_logs'],
] as const;

const stamp = (r: LocalRecord | undefined): number | null => {
  if (!r) return null;
  for (const k of ['updatedAt']) {
    const n = typeof r[k] === 'string' ? Date.parse(r[k]) : NaN;
    if (Number.isFinite(n)) return n;
  }
  return null;
};
const stable = (value: any): any => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === 'object'
    ? Object.keys(value).sort().reduce((result: Record<string, any>, key) => {
        result[key] = stable(value[key]);
        return result;
      }, {})
    : value;
const equal = (a: unknown, b: unknown) => JSON.stringify(stable(a)) === JSON.stringify(stable(b));
const factoryId = (r: LocalRecord) => r.factoryId || r.currentFactoryId || null;

export interface CloudSyncReport {
  syncedCount: number; pushedCount: number; pulledCount: number;
  conflictCount: number; failedCount: number; errors: string[];
}

/** Safe two-way sync: no deletes; newer timestamp wins; ambiguous edits are retained as conflicts. */
export async function syncCloudRecords(): Promise<CloudSyncReport> {
  const out: CloudSyncReport = { syncedCount: 0, pushedCount: 0, pulledCount: 0, conflictCount: 0, failedCount: 0, errors: [] };
  const session = await getCurrentSession();
  if (!session?.user?.id) { out.failedCount++; out.errors.push('Sign in before cloud sync.'); return out; }
  const access = await loadAccessProfile(session.user.id);
  if (!access?.user.active || access.approvalStatus !== 'approved') {
    out.failedCount++; out.errors.push('Cloud sync requires an approved, active account.'); return out;
  }
  const supabase = getSupabaseClient();
  const supervisor = access.user.role === 'supervisor';
  const locals = await dbService.getAll<LocalRecord>('factories');
  const targetFactoryIds = new Set(locals.filter(f => ['empire teas', 'millennium teas'].includes(String(f.name || '').trim().toLowerCase())).map(f => f.id));
  const localEmployees = await dbService.getAll<LocalRecord>('employees');
  const employeeFactoryById = new Map(localEmployees.map(e => [e.id, e.currentFactoryId]));
  const allowedRecord = (store: string, record: LocalRecord): boolean => {
    if (store === 'factories') return targetFactoryIds.has(record.id);
    if (store === 'employees') return targetFactoryIds.has(record.currentFactoryId);
    if (store === 'employee_payments') return targetFactoryIds.has(employeeFactoryById.get(record.employeeId) || '');
    if (store === 'payroll_runs') return Array.isArray(record.items) && record.items.length > 0 && record.items.every((item: any) => targetFactoryIds.has(item.factoryId));
    if (store === 'boarding_locations' || store === 'audit_logs') return true;
    const fid = factoryId(record);
    return !fid || targetFactoryIds.has(fid);
  };
  const cloudToLocal = new Map<string, string>();
  const localToCloud = new Map<string, string>();

  // Discover existing cloud mappings for office staff; only admins may create/update factory master rows.
  if (!supervisor) {
    const cloudFactories = await supabase.from('factories').select('id,legacy_id,name').eq('company_id', access.companyId);
    if (cloudFactories.error) { out.failedCount++; out.errors.push('Factory mapping list: ' + cloudFactories.error.message); return out; }
    for (const cf of cloudFactories.data || []) if (cf.legacy_id && ['empire teas', 'millennium teas'].includes(String(cf.name || '').trim().toLowerCase())) { cloudToLocal.set(cf.id, cf.legacy_id); localToCloud.set(cf.legacy_id, cf.id); }
  }

  if (!supervisor) {
    for (const f of locals) {
      const isRequiredFactory = ['empire teas', 'millennium teas'].includes(String(f.name || '').trim().toLowerCase());
      // Only the two approved target factories may bootstrap from legacy local data.
      // Other factory rows require a fresh, explicit admin edit (updatedAt) before cloud creation.
      if (!isRequiredFactory) continue;
      let q = await supabase.from('factories').select('id,code,name,is_active').eq('company_id', access.companyId).eq('legacy_id', f.id).maybeSingle();
      if (q.error) { out.failedCount++; out.errors.push('Factory mapping: ' + q.error.message); continue; }
      if (access.user.role !== 'admin') {
        if (q.data?.id) { localToCloud.set(f.id, q.data.id); cloudToLocal.set(q.data.id, f.id); }
        continue;
      }
      let id = q.data?.id as string | undefined;
      if (!id) {
        const ins = await supabase.from('factories').insert({ company_id: access.companyId, legacy_id: f.id, code: f.code, name: f.name, is_active: !!f.active }).select('id').single();
        if (ins.error) { out.failedCount++; out.errors.push('Factory mapping for ' + f.name + ': ' + ins.error.message); continue; }
        id = ins.data.id;
      } else if (f.cloudSyncReady && (q.data?.code !== f.code || q.data?.name !== f.name || q.data?.is_active !== !!f.active)) {
        const upd = await supabase.from('factories').update({ code: f.code, name: f.name, is_active: !!f.active }).eq('company_id', access.companyId).eq('id', id);
        if (upd.error) { out.failedCount++; out.errors.push('Factory metadata for ' + f.name + ': ' + upd.error.message); continue; }
      }
      if (!id) { out.failedCount++; out.errors.push('Factory mapping unavailable for ' + f.name); continue; }
      localToCloud.set(f.id, id); cloudToLocal.set(id, f.id);
    }
  } else {
    const a = await supabase.from('user_factory_assignments').select('factory_id').eq('user_id', session.user.id).eq('company_id', access.companyId);
    if (a.error) { out.failedCount++; out.errors.push(a.error.message); return out; }
    const ids = (a.data || []).map((v: { factory_id: string }) => v.factory_id);
    if (ids.length) {
      const m = await supabase.from('factories').select('id,legacy_id').eq('company_id', access.companyId).in('id', ids);
      if (m.error) { out.failedCount++; out.errors.push(m.error.message); return out; }
      for (const f of m.data || []) if (f.legacy_id) { cloudToLocal.set(f.id, f.legacy_id); localToCloud.set(f.legacy_id, f.id); }
    }
  }

  const collections = supervisor ? COLLECTIONS.filter(x => x[0] === 'employees' || x[0] === 'attendance') : COLLECTIONS;
  for (const [store, cloudName] of collections) {
    try {
      const localRows = await dbService.getAll<LocalRecord>(store);
      const remote = await supabase.from('app_records').select('record_id,factory_id,payload')
        .eq('company_id', access.companyId).eq('collection_name', cloudName);
      if (remote.error) throw remote.error;
      const remoteById = new Map<string, RemoteRecord>((remote.data || []).map((r: RemoteRecord) => [r.record_id, r]));
      const localById = new Map(localRows.map(r => [r.id, r]));
      for (const l of localRows) {
        if (!allowedRecord(store, l)) continue;
        const fid = store === 'factories' ? l.id : factoryId(l);
        if (supervisor && (!fid || !localToCloud.has(fid))) continue;
        const r = remoteById.get(l.id);
        if (!r) {
          if (supervisor && store === 'employees') continue;
          // Existing local-only records are not automatically migrated on first sign-in.
          // This prevents legacy demo/history data from being silently uploaded.
          if (!l.cloudSyncReady) {
            out.conflictCount++;
            out.errors.push('Local legacy record pending admin-reviewed migration: ' + store + '/' + l.id);
            continue;
          }
          const cfid = fid ? localToCloud.get(fid) : null;
          if (fid && !cfid) {
            if (l.cloudSyncReady) { out.failedCount++; out.errors.push('Cloud write blocked: no authorized factory mapping for ' + store + '/' + l.id + '.'); }
            else { out.conflictCount++; out.errors.push('Local ' + store + '/' + l.id + ' is not assigned to an approved cloud factory; preserved locally.'); }
            continue;
          }
          const payload = store === 'attendance'
            ? { ...l, syncStatus: 'synced', isOfflineCreated: false }
            : store === 'factories' ? { ...l, cloudSyncConfirmed: true } : l;
          const put = await supabase.from('app_records').upsert({ company_id: access.companyId, collection_name: cloudName, record_id: l.id, factory_id: cfid || null, payload, updated_by: session.user.id }, { onConflict: 'company_id,collection_name,record_id' });
          if (put.error) throw put.error;
          if (store === 'attendance' || store === 'factories') await dbService.put(store, payload);
          out.pushedCount++; out.syncedCount++; continue;
        }
        if (store === 'factories' && l.cloudSyncReady && !l.cloudSyncConfirmed && r.payload.cloudSyncConfirmed === true) {
          await dbService.put(store, r.payload); out.pulledCount++; out.syncedCount++;
          continue;
        }
        if (store === 'attendance' && l.syncStatus !== 'synced' && r.payload.syncStatus === 'synced') {
          const stripSyncMetadata = (record: LocalRecord) => {
            const businessFields = { ...record };
            delete businessFields.syncStatus;
            delete businessFields.isOfflineCreated;
            return businessFields;
          };
          if (equal(stripSyncMetadata(l), stripSyncMetadata(r.payload))) {
            await dbService.put(store, r.payload); out.pulledCount++; out.syncedCount++;
            continue;
          }
        }
        if (equal(l, r.payload)) continue;
        const lt = stamp(l), rt = stamp(r.payload);
        if (supervisor && store === 'employees') {
          if (rt !== null && (lt === null || rt > lt)) { await dbService.put(store, r.payload); out.pulledCount++; out.syncedCount++; }
          else { out.conflictCount++; out.errors.push('Supervisor employee record retained pending a safe refresh: ' + l.id); }
          continue;
        }
        if (!l.cloudSyncReady) {
          // Factory configuration is centrally authoritative unless an Admin explicitly saved a local edit.
          if (store === 'factories' || (rt !== null && (lt === null || rt > lt))) {
            await dbService.put(store, r.payload); out.pulledCount++; out.syncedCount++;
          } else {
            out.conflictCount++; out.errors.push('Local legacy record differs from cloud and needs admin review: ' + store + '/' + l.id);
          }
          continue;
        }
        if (lt !== null && (rt === null || lt > rt)) {
          const cfid = fid ? localToCloud.get(fid) : null;
          if (fid && !cfid) { out.failedCount++; out.errors.push('Cloud update blocked: no authorized factory mapping for ' + store + '/' + l.id + '.'); continue; }
          const payload = store === 'attendance'
            ? { ...l, syncStatus: 'synced', isOfflineCreated: false }
            : store === 'factories' ? { ...l, cloudSyncConfirmed: true } : l;
          const put = await supabase.from('app_records').upsert({ company_id: access.companyId, collection_name: cloudName, record_id: l.id, factory_id: cfid || null, payload, updated_by: session.user.id }, { onConflict: 'company_id,collection_name,record_id' });
          if (put.error) throw put.error;
          if (store === 'attendance' || store === 'factories') await dbService.put(store, payload);
          out.pushedCount++; out.syncedCount++;
        } else if (rt !== null && (lt === null || rt > lt)) {
          await dbService.put(store, r.payload); out.pulledCount++; out.syncedCount++;
        } else {
          out.conflictCount++; out.errors.push('Conflict retained: ' + store + '/' + l.id + ' has no unambiguous newer timestamp.');
        }
      }
      for (const r of remoteById.values()) {
        if (localById.has(r.record_id)) continue;
        let payload = r.payload;
        if (supervisor) {
          if (!r.factory_id || !cloudToLocal.has(r.factory_id)) continue;
          payload = { ...payload };
          if (payload.factoryId) payload.factoryId = cloudToLocal.get(r.factory_id);
          if (payload.currentFactoryId) payload.currentFactoryId = cloudToLocal.get(r.factory_id);
        } else if (r.factory_id && !cloudToLocal.has(r.factory_id)) {
          out.conflictCount++; out.errors.push('Remote ' + store + '/' + r.record_id + ' has no local factory mapping.'); continue;
        }
        if (!allowedRecord(store, payload)) continue;
        await dbService.put(store, payload); out.pulledCount++; out.syncedCount++;
      }
    } catch (e: any) { out.failedCount++; out.errors.push(store + ' sync failed: ' + (e?.message || 'unknown error')); }
  }

  const queue = await dbService.getOfflineQueue();
  const attendance = new Map((await dbService.getAll<LocalRecord>('attendance')).map(r => [r.id, r]));
  for (const item of queue) {
    const local = attendance.get(item.payload?.id);
    if (!local) continue;
    const check = await supabase.from('app_records').select('payload').eq('company_id', access.companyId)
      .eq('collection_name', 'attendance').eq('record_id', local.id).maybeSingle();
    if (!check.error && check.data && equal(local, check.data.payload)) {
      await dbService.removeOfflineItem(item.id);
      local.syncStatus = 'synced'; local.conflictReason = undefined; await dbService.put('attendance', local);
    }
  }
  return out;
}
