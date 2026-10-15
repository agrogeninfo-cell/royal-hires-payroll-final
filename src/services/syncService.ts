import { syncCloudRecords, type CloudSyncReport } from './cloudSyncServiceV3';

export type SyncReport = CloudSyncReport;

export class SyncService {
  /** Sync local records to/from Supabase. Local records are never deleted by sync. */
  public static async processQueue(): Promise<SyncReport> {
    return syncCloudRecords();
  }
}
