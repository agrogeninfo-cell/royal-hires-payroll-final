import { dbService } from '../db/indexedDb';
import { AttendanceRecord, OfflineQueueItem } from '../types';

export interface SyncReport {
  syncedCount: number;
  conflictCount: number;
  failedCount: number;
  errors: string[];
}

export class SyncService {
  /**
   * Processes the offline synchronization queue.
   * Ensures idempotency: duplicate attendance entries for same employee and date are detected.
   */
  public static async processQueue(): Promise<SyncReport> {
    const queue = await dbService.getOfflineQueue();
    const report: SyncReport = {
      syncedCount: 0,
      conflictCount: 0,
      failedCount: 0,
      errors: [],
    };

    if (queue.length === 0) return report;

    // Load existing records for duplicate check
    const existingAttendance = await dbService.getAll<AttendanceRecord>('attendance');

    for (const item of queue) {
      try {
        if (item.operationType === 'CREATE_ATTENDANCE') {
          const newAtt = item.payload as AttendanceRecord;

          // Check if an attendance record already exists for the same employee, factory, and date
          const conflict = existingAttendance.find(
            (a) =>
              a.employeeId === newAtt.employeeId &&
              a.factoryId === newAtt.factoryId &&
              a.date === newAtt.date &&
              a.id !== newAtt.id
          );

          if (conflict) {
            // Mark conflict
            report.conflictCount++;
            item.status = 'conflict';
            item.error = `Conflict: Attendance for ${newAtt.employeeName} on ${newAtt.date} was already recorded by ${conflict.supervisorName}.`;
            await dbService.put('offline_queue', item);
            
            // Mark attendance record as conflict
            newAtt.syncStatus = 'conflict';
            newAtt.conflictReason = item.error;
            await dbService.put('attendance', newAtt);
            continue;
          }

          // Otherwise, save and mark synced
          newAtt.syncStatus = 'synced';
          newAtt.isOfflineCreated = true;
          newAtt.updatedAt = new Date().toISOString();

          await dbService.put('attendance', newAtt);
          await dbService.removeOfflineItem(item.id);

          await dbService.logAudit(
            newAtt.supervisorName || 'Offline Worker',
            'supervisor',
            'SYNC_OFFLINE_ATTENDANCE',
            'AttendanceRecord',
            newAtt.id,
            `Synchronized offline attendance for ${newAtt.employeeName} (${newAtt.date})`
          );

          report.syncedCount++;
        } else if (item.operationType === 'UPDATE_ATTENDANCE') {
          const updatedAtt = item.payload as AttendanceRecord;
          updatedAtt.syncStatus = 'synced';
          updatedAtt.updatedAt = new Date().toISOString();

          await dbService.put('attendance', updatedAtt);
          await dbService.removeOfflineItem(item.id);
          report.syncedCount++;
        }
      } catch (err: any) {
        report.failedCount++;
        report.errors.push(err.message || 'Unknown sync error');
        item.retryCount = (item.retryCount || 0) + 1;
        item.error = err.message;
        await dbService.put('offline_queue', item);
      }
    }

    return report;
  }
}
