import { syncCloudRecords, type CloudSyncReport } from './cloudSyncServiceV2';

export type SyncReport = CloudSyncReport;

export class SyncService {
  /** Sync local records to/from Supabase. Local records are never deleted by sync. */
  public static async processQueue(): Promise<SyncReport> {
    return syncCloudRecords();
  }
}
