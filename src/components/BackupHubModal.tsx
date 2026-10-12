import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  HardDrive,
  Database,
  CheckCircle2,
  AlertTriangle,
  History,
  FileJson,
  Lock,
  Smartphone,
} from 'lucide-react';
import { ForeverStorageService } from '../db/foreverStorage';

interface BackupHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInstall?: () => void;
}

export const BackupHubModal: React.FC<BackupHubModalProps> = ({
  isOpen,
  onClose,
  onOpenInstall,
}) => {
  const {
    factories,
    employees,
    attendance,
    payrollRuns,
    payments,
    invoices,
    receipts,
    boardingLocations,
    auditLogs,
    downloadForeverBackup,
    restoreFromForeverMirror,
    importBackupJson,
    lastBackupTime,
  } = useApp();

  const [feedback, setFeedback] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const totalRecords =
    factories.length +
    employees.length +
    attendance.length +
    payrollRuns.length +
    payments.length +
    invoices.length +
    receipts.length +
    boardingLocations.length +
    auditLogs.length;

  const snapshotHistory = ForeverStorageService.getSnapshotHistory();

  const handleDownload = async () => {
    setIsProcessing(true);
    try {
      await downloadForeverBackup();
      setFeedback('Forever Backup JSON downloaded successfully to your device!');
      setTimeout(() => setFeedback(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Download failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreMirror = async () => {
    if (!window.confirm('Restore all data from the latest LocalStorage Forever Mirror?')) return;
    setIsProcessing(true);
    try {
      const ok = await restoreFromForeverMirror();
      if (ok) {
        setFeedback('Successfully restored database from LocalStorage Forever Mirror!');
      } else {
        setErrorMsg('No mirror snapshot found in LocalStorage.');
      }
      setTimeout(() => setFeedback(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        await importBackupJson(text);
        setFeedback('Database restored from uploaded backup file successfully!');
        setTimeout(() => setFeedback(''), 4000);
      } catch (err: any) {
        setErrorMsg('Invalid backup file: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto w-full max-w-full">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 flex items-center space-x-2">
                <span>Forever Data Safety &amp; Backup Hub</span>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  Dual-Layer Sync
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Continuous auto-mirroring (IndexedDB + LocalStorage) &amp; timestamped file backups
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        {feedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{feedback}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-300 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Live Status Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] text-slate-500 font-medium block">Total Saved Records</span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">{totalRecords}</span>
            <span className="text-[10px] text-emerald-600 font-medium">All entities active</span>
          </div>

          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[11px] text-emerald-800 font-medium block">IndexedDB Primary</span>
            <span className="text-sm font-bold text-emerald-950 mt-1 flex items-center space-x-1">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Active &amp; Persisted</span>
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">Offline capable</span>
          </div>

          <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-blue-800 font-medium block">LocalStorage Mirror</span>
            <span className="text-sm font-bold text-blue-950 mt-1 flex items-center space-x-1">
              <HardDrive className="w-3.5 h-3.5 text-blue-600" />
              <span>Auto-Mirrored</span>
            </span>
            <span className="text-[10px] text-blue-700 font-medium">
              {lastBackupTime ? `Updated ${lastBackupTime}` : 'Continuous sync'}
            </span>
          </div>
        </div>

        {/* Detailed Records Breakdown */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between items-center font-bold text-slate-700 border-b border-slate-200 pb-1.5">
            <span>Entity Type</span>
            <span>Recorded Items</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600 text-[11px]">
            <div className="flex justify-between">
              <span>🏭 Active Factories:</span>
              <strong className="text-slate-800">{factories.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>👥 Helpers (Fixed):</span>
              <strong className="text-slate-800">{employees.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>📋 Attendance Days:</span>
              <strong className="text-slate-800">{attendance.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>💵 Payroll Runs:</span>
              <strong className="text-slate-800">{payrollRuns.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>📄 Factory Invoices:</span>
              <strong className="text-slate-800">{invoices.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>🧾 Factory Receipts:</span>
              <strong className="text-slate-800">{receipts.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>🏨 Hostels &amp; Quarters:</span>
              <strong className="text-slate-800">{boardingLocations.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>📜 Audit Logs:</span>
              <strong className="text-slate-800">{auditLogs.length}</strong>
            </div>
          </div>
        </div>

        {/* Backup & Recovery Actions */}
        <div className="space-y-3">
          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Backup &amp; Restore Actions
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isProcessing}
              className="p-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download Forever Backup (.json)</span>
            </button>

            {/* Instant Restore from Mirror */}
            <button
              onClick={handleRestoreMirror}
              disabled={isProcessing}
              className="p-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>Restore from Local Mirror</span>
            </button>
          </div>

          {/* Install as Android App Button */}
          {onOpenInstall && (
            <div className="pt-1">
              <button
                onClick={() => {
                  onClose();
                  onOpenInstall();
                }}
                className="w-full py-2.5 px-3 rounded-xl border border-emerald-500/30 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center space-x-2 transition cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>📱 Install App on Android Phone / Generate APK</span>
              </button>
            </div>
          )}

          {/* Upload File Input */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Restore from Backup File on Device
            </label>
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer border border-slate-200 rounded-xl p-1"
            />
          </div>
        </div>

        {/* Snapshot History */}
        {snapshotHistory.length > 0 && (
          <div className="pt-3 border-t border-slate-200 text-xs">
            <span className="font-bold text-slate-700 flex items-center space-x-1.5 mb-2">
              <History className="w-3.5 h-3.5 text-slate-500" />
              <span>Recent Auto-Mirror Snapshots ({snapshotHistory.length})</span>
            </span>
            <div className="space-y-1.5">
              {snapshotHistory.map((snap, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-[11px]"
                >
                  <span className="font-mono text-slate-500">
                    {new Date(snap.timestamp).toLocaleString()}
                  </span>
                  <span className="text-slate-700 font-semibold">{snap.dataSnippet}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
