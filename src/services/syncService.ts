import { syncCloudRecords, type CloudSyncReport } from './cloudSyncServiceV3';

export type SyncReport = CloudSyncReport;

export class SyncService {
  private static inFlight: Promise<SyncReport> | null = null;
  private static rerunRequested = false;

  /** Coalesce overlapping triggers while ensuring changes received during a pass get another pass. */
  public static processQueue(): Promise<SyncReport> {
    if (this.inFlight) {
      this.rerunRequested = true;
      return this.inFlight;
    }
    this.inFlight = (async () => {
      let report: SyncReport;
      do {
        this.rerunRequested = false;
        report = await syncCloudRecords();
      } while (this.rerunRequested);
      return report;
    })().finally(() => {
      this.inFlight = null;
      this.rerunRequested = false;
    });
    return this.inFlight;
  }
}
