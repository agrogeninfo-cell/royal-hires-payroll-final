import { syncCloudRecords, type CloudSyncReport } from './cloudSyncService';

export type SyncReport = CloudSyncReport;

export class SyncService {
  /** Sync local records to/from Supabase. Local records are never deleted by sync. */
  public static async processQueue(): Promise<SyncReport> {
    return syncCloudRecords();
  }
}
