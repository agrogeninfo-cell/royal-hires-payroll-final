/**
 * Forever Storage & Backup Engine
 * Provides dual-layer persistence (IndexedDB + LocalStorage mirror + Auto-snapshots)
 * Provides a best-effort local mirror and snapshots. This cannot guarantee zero data loss;
 * export backups regularly and test restore before relying on this for payroll records.
 */

export interface SystemBackupPayload {
  version: string;
  timestamp: string;
  recordsCount: {
    users: number;
    factories: number;
    employees: number;
    attendance: number;
    overtime: number;
    offlineQueue: number;
    payrollRuns: number;
    payments: number;
    invoices: number;
    receipts: number;
    boardingLocations: number;
    auditLogs: number;
  };
  data: {
    users: any[];
    factories: any[];
    employees: any[];
    attendance: any[];
    overtime?: any[];
    offline_queue?: any[];
    payroll_runs: any[];
    employee_payments: any[];
    invoices: any[];
    receipts: any[];
    boarding_locations: any[];
    billing_rate_history: any[];
    audit_logs: any[];
  };
}

const MIRROR_STORAGE_KEY = import.meta.env?.VITE_PUBLIC_DEMO_MODE === 'true' ? 'royal_pay_public_demo_mirror_v1' : 'lanka_manpower_forever_mirror_v2';
const SNAPSHOT_HISTORY_KEY = import.meta.env?.VITE_PUBLIC_DEMO_MODE === 'true' ? 'royal_pay_public_demo_snapshot_history_v1' : 'lanka_manpower_snapshot_history_v2';

export class ForeverStorageService {
  /**
   * Saves a complete snapshot mirror of all data to LocalStorage
   */
  public static saveMirrorSnapshot(payload: SystemBackupPayload): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const serialized = JSON.stringify(payload);
      localStorage.setItem(MIRROR_STORAGE_KEY, serialized);

      // Keep last 3 historical snapshots with timestamps
      const historyStr = localStorage.getItem(SNAPSHOT_HISTORY_KEY);
      let history: { timestamp: string; count: number; dataSnippet: string }[] = [];
      if (historyStr) {
        try {
          history = JSON.parse(historyStr);
        } catch {
          history = [];
        }
      }

      const totalCount = Object.values(payload.recordsCount).reduce((a, b) => a + b, 0);
      const newEntry = {
        timestamp: payload.timestamp,
        count: totalCount,
        dataSnippet: `${payload.recordsCount.employees} Helpers, ${payload.recordsCount.attendance} Attendance, ${payload.recordsCount.invoices} Invoices`,
      };

      // Prepend and limit to 5
      history = [newEntry, ...history.filter((h) => h.timestamp !== payload.timestamp)].slice(0, 5);
      localStorage.setItem(SNAPSHOT_HISTORY_KEY, JSON.stringify(history));
    } catch (err) {
      console.warn('LocalStorage mirror save error (storage might be full):', err);
    }
  }

  /**
   * Retrieves the latest snapshot mirror from LocalStorage
   */
  public static getMirrorSnapshot(): SystemBackupPayload | null {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;
      const str = localStorage.getItem(MIRROR_STORAGE_KEY);
      if (!str) return null;
      return JSON.parse(str) as SystemBackupPayload;
    } catch (err) {
      console.error('Failed to parse mirror snapshot:', err);
      return null;
    }
  }

  /**
   * Retrieves snapshot history summary
   */
  public static getSnapshotHistory(): { timestamp: string; count: number; dataSnippet: string }[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return [];
      const historyStr = localStorage.getItem(SNAPSHOT_HISTORY_KEY);
      return historyStr ? JSON.parse(historyStr) : [];
    } catch {
      return [];
    }
  }

  /**
   * Downloads JSON backup directly as a file to the user's device
   */
  public static downloadBackupFile(payload: SystemBackupPayload): void {
    const filename = `LankaManpower_Forever_Backup_${payload.timestamp.split('T')[0]}_${Date.now().toString().slice(-4)}.json`;
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
