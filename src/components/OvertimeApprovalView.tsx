import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Clock, Check, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

export const OvertimeApprovalView: React.FC = () => {
  const { currentUser, attendance, factories, approveAttendanceOT, t } = useApp();
  const [filterFactory, setFilterFactory] = useState<string>('all');
  const [feedback, setFeedback] = useState<string>('');

  if (currentUser.role !== 'admin') {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-rose-200 shadow-xs">
        <ShieldAlert className="w-12 h-12 mx-auto text-rose-500 mb-2" />
        <h3 className="text-lg font-bold text-slate-800">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Overtime approval is strictly an Administrator privileged operation. Please switch to the Administrator profile to review and approve submitted overtime.
        </p>
      </div>
    );
  }

  const overtimeRecords = attendance.filter((a) => a.totalOtHours > 0);

  const filtered = overtimeRecords.filter((a) => {
    if (filterFactory !== 'all' && a.factoryId !== filterFactory) return false;
    return true;
  });

  const pendingRecords = filtered.filter((a) => a.submissionStatus === 'submitted');
  const resolvedRecords = filtered.filter((a) => a.submissionStatus !== 'submitted');

  const handleApprove = async (id: string, name: string) => {
    try {
      await approveAttendanceOT(id, true);
      setFeedback(`Approved overtime for ${name}`);
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (id: string, name: string) => {
    try {
      await approveAttendanceOT(id, false);
      setFeedback(`Rejected overtime for ${name}`);
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <Clock className="w-5 h-5 text-amber-600" />
            <span>Overtime Verification &amp; Approval</span>
          </h2>
          <p className="text-xs text-slate-500">
            Mandatory Admin authorization before overtime enters payroll or factory invoicing
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filterFactory}
            onChange={(e) => setFilterFactory(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none"
          >
            <option value="all">All Factories</option>
            {factories.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* Pending Approval Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <span>Awaiting Admin Approval ({pendingRecords.length})</span>
          </h3>
          <span className="text-xs text-slate-400">Overtime requires explicit authorization</span>
        </div>

        {pendingRecords.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-xs">
            No pending overtime submissions. All records are up to date.
          </div>
        ) : (
          <div className="space-y-2">
            {pendingRecords.map((item) => {
              const fac = factories.find((f) => f.id === item.factoryId);
              const employeePay = item.totalOtHours * (fac?.employeeOvertimeRateHourly || 0);
              const factoryBill = item.totalOtHours * (fac?.factoryOvertimeRateHourly || 0);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-4 border border-amber-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-amber-300 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-xs font-bold bg-slate-100 rounded text-slate-700">
                        {item.employeeId}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{item.employeeName}</span>
                      <span className="text-xs text-slate-500">({item.factoryName})</span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                      <span>Date: <strong className="text-slate-800">{item.date}</strong></span>
                      <span>
                        OT Duration: <strong className="text-amber-700 font-bold">{item.otHours}h {item.otMinutes}m ({item.totalOtHours} hrs)</strong>
                      </span>
                      <span>Recorded By: <span className="text-slate-700">{item.supervisorName}</span></span>
                    </div>

                    <div className="text-xs pt-1 flex items-center space-x-4">
                      <span className="text-blue-700 font-semibold">
                        Worker OT Pay: LKR {employeePay.toLocaleString()} ({fac?.employeeOvertimeRateHourly} LKR/hr)
                      </span>
                      <span className="text-emerald-700 font-semibold">
                        Factory OT Billing: LKR {factoryBill.toLocaleString()} ({fac?.factoryOvertimeRateHourly} LKR/hr)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => handleReject(item.id, item.employeeName)}
                      className="px-3 py-1.5 text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg flex items-center space-x-1 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleApprove(item.id, item.employeeName)}
                      className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg flex items-center space-x-1 shadow-xs transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve OT</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolved History */}
      {resolvedRecords.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-800">
            Recently Processed Overtime Records ({resolvedRecords.length})
          </h3>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">Helper</th>
                    <th className="p-3">Factory</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">OT Hours</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Approved By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {resolvedRecords.slice(0, 10).map((r) => (
                    <tr key={r.id}>
                      <td className="p-3 font-semibold text-slate-900">{r.employeeName}</td>
                      <td className="p-3 text-slate-500">{r.factoryName}</td>
                      <td className="p-3">{r.date}</td>
                      <td className="p-3 font-bold">{r.totalOtHours} hrs</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            r.submissionStatus === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.submissionStatus === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500">{r.approvedBy || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
