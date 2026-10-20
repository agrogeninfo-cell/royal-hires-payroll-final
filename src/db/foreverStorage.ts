import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

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
  public static async downloadBackupFile(payload: SystemBackupPayload): Promise<void> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      throw new Error('Backup download is available only in the app or browser.');
    }

    const datePart = (payload.timestamp || new Date().toISOString()).split('T')[0];
    const filename = `RoyalPay_Forever_Backup_${datePart}_${Date.now().toString().slice(-4)}.json`;
    const jsonStr = JSON.stringify(payload, null, 2);
    if (!jsonStr || jsonStr === '{}') {
      throw new Error('Backup file could not be prepared. No JSON data was generated.');
    }

    // Android WebView does not reliably hand Blob URLs to the system download
    // manager. Write the backup with Capacitor and open the native share sheet
    // so the user can save a copy to Downloads or another chosen destination.
    if (Capacitor.isNativePlatform()) {
      try {
        const savedFile = await Filesystem.writeFile({
          path: filename,
          data: jsonStr,
          directory: Directory.Documents,
          encoding: Encoding.UTF8,
          recursive: true,
        });
        await Share.share({
          title: 'Royal Pay JSON Backup',
          text: 'Save this Royal Pay backup file in a secure location.',
          url: savedFile.uri,
          dialogTitle: 'Save Royal Pay backup',
        });
        return;
      } catch (error) {
        console.error('Native backup export failed:', error);
        throw new Error('Could not export the backup on this Android device. Check available storage and try again. Your app records were not changed.');
      }
    }

    // Browser/PWA fallback.
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    link.setAttribute('aria-label', 'Download Royal Pay JSON backup');
    document.body.appendChild(link);

    try {
      link.click();
      // Keep the Blob URL alive briefly so Android Chrome can begin the download.
      window.setTimeout(() => {
        URL.revokeObjectURL(url);
        link.remove();
      }, 1500);
    } catch (error) {
      URL.revokeObjectURL(url);
      link.remove();
      throw new Error('The browser could not start the backup download. Try opening Royal Pay in Chrome, or use Share / Save a copy.');
    }
  }
}
