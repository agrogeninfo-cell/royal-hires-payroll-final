import { syncCloudRecords, type CloudSyncReport } from './cloudSyncServiceV3';

export type SyncReport = CloudSyncReport;

export class SyncService {
  private static inFlight: Promise<SyncReport> | null = null;

  /** Serialize sync passes so realtime events cannot start overlapping reconciliations. */
  public static processQueue(): Promise<SyncReport> {
    if (!this.inFlight) {
      this.inFlight = syncCloudRecords().finally(() => {
        this.inFlight = null;
      });
    }
    return this.inFlight;
  }
}
