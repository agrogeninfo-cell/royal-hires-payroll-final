import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  History,
  Download,
  Upload,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  Database,
  FileJson,
} from 'lucide-react';

export const AuditView: React.FC = () => {
  const { auditLogs, exportBackupJson, importBackupJson, resetDatabase, currentUser } = useApp();
  const [filterAction, setFilterAction] = useState<string>('all');
  const [feedback, setFeedback] = useState<string>('');
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [showImportBox, setShowImportBox] = useState<boolean>(false);

  const filteredLogs = auditLogs.filter((log) => {
    if (filterAction !== 'all' && !log.action.includes(filterAction)) return false;
    return true;
  });

  const handleExportBackup = async () => {
    try {
      const json = await exportBackupJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LankaManpower_DB_Backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setFeedback('Downloaded full database JSON backup successfully.');
      setTimeout(() => setFeedback(''), 4000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleImportBackup = async () => {
    if (!importJsonText.trim()) return;
    try {
      await importBackupJson(importJsonText);
      setShowImportBox(false);
      setImportJsonText('');
      setFeedback('Database restored from JSON backup successfully.');
      setTimeout(() => setFeedback(''), 4000);
    } catch (err: any) {
      alert(`Invalid backup JSON: ${err.message}`);
    }
  };

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to reset all data back to the default Sri Lankan demo seed?')) {
      await resetDatabase();
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Top Banner & Backup Controls */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <History className="w-5 h-5 text-indigo-600" />
            <span>Audit Trail &amp; Database Disaster Recovery</span>
          </h2>
          <p className="text-xs text-slate-500">
            Immutable chronological transaction logs and full JSON backup/restore engine
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportBackup}
            className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Backup JSON</span>
          </button>
          {currentUser.role === 'admin' && (
            <>
              <button
                onClick={() => setShowImportBox(!showImportBox)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Restore Backup</span>
              </button>
              <button
                onClick={handleResetData}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>Reset to Seed Data</span>
              </button>
            </>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* Restore JSON Drawer */}
      {showImportBox && (
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-300 space-y-3">
          <h4 className="font-bold text-xs text-slate-800 flex items-center space-x-1.5">
            <FileJson className="w-4 h-4 text-slate-600" />
            <span>Paste Database Backup JSON to Restore:</span>
          </h4>
          <textarea
            rows={4}
            value={importJsonText}
            onChange={(e) => setImportJsonText(e.target.value)}
            placeholder='{"timestamp": "...", "factories": [...]}'
            className="w-full text-xs font-mono p-2 bg-white border border-slate-300 rounded-lg"
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowImportBox(false)}
              className="px-3 py-1 text-xs border rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleImportBackup}
              className="px-4 py-1 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
            >
              Confirm Restore
            </button>
          </div>
        </div>
      )}

      {/* Filter and Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Chronological System Events</span>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg p-1.5"
          >
            <option value="all">All Actions</option>
            <option value="RATE">Billing Rate Events</option>
            <option value="ATTENDANCE">Attendance Events</option>
            <option value="OVERTIME">Overtime Approvals</option>
            <option value="PAYROLL">Payroll Events</option>
            <option value="PAYMENT">Payment Events</option>
            <option value="INVOICE">Invoice Events</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor &amp; Role</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entity</th>
                <th className="p-3">Operational Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 font-sans">
                    No matching audit records.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="p-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-semibold text-slate-800 font-sans whitespace-nowrap">
                      {log.actor} ({log.actorRole})
                    </td>
                    <td className="p-3 font-bold text-indigo-700 whitespace-nowrap">{log.action}</td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {log.entityType} ({log.entityId})
                    </td>
                    <td className="p-3 font-sans text-slate-800">{log.details}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
