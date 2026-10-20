import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { PayrollItem, PayrollRun, EmployeePayment } from '../types';
import { PayrollService } from '../services/payrollService';
import { createPayslipPdf } from '../utils/payslipPdf';
import { createExcelXmlWorkbook } from '../utils/excelXml';
import { exportFile } from '../utils/exportFile';
import {
  Calculator,
  Calendar,
  CheckCircle2,
  DollarSign,
  Download,
  AlertCircle,
  CreditCard,
  Building2,
  User,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const PayrollView: React.FC = () => {
  const {
    currentUser,
    factories,
    employees,
    attendance,
    boardingLocations,
    payments,
    payrollRuns,
    savePayrollRun,
    savePayment,
    t,
  } = useApp();

  const isSupervisor = currentUser.role === 'supervisor';

  // Period state (default to current month)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [periodStart, setPeriodStart] = useState<string>(firstDay);
  const [periodEnd, setPeriodEnd] = useState<string>(lastDay);
  const [selectedFactoryId, setSelectedFactoryId] = useState<string>('all');

  // Preview Run State
  const [previewRun, setPreviewRun] = useState<PayrollRun | null>(null);
  const [selectedItemForPayment, setSelectedItemForPayment] = useState<PayrollItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'cheque'>('cash');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  const [payslipPeriodType, setPayslipPeriodType] = useState<'weekly' | 'monthly'>('monthly');

  const exportPayslipsPdf = async (items: PayrollItem[]) => {
    if (!previewRun || items.length === 0) {
      setFeedback('Calculate payroll first, then select the payslips to export.');
      return;
    }
    try {
      const pdf = createPayslipPdf(items, previewRun, payslipPeriodType);
      const safePayrollNumber = previewRun.payrollNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
      const fileName = `Royal_Hires_Payslips_${safePayrollNumber}.pdf`;
      await exportFile({
        fileName,
        data: window.btoa(pdf),
        mimeType: 'application/pdf',
        base64: true,
        title: 'Royal Hires payslip PDF',
        dialogTitle: 'Save or share payslip PDF',
      });
      setFeedback(`PDF payslip export prepared: ${fileName}`);
      window.setTimeout(() => setFeedback(''), 5000);
    } catch (error) {
      console.error('Payslip PDF export failed:', error);
      setFeedback(error instanceof Error ? `Payslip PDF export failed: ${error.message}` : 'Payslip PDF export failed. Please try again.');
    }
  };

  const handleGeneratePayroll = () => {
    const targetEmployees = employees.filter((e) => {
      if (e.status !== 'active') return false;
      if (selectedFactoryId !== 'all' && e.currentFactoryId !== selectedFactoryId) return false;
      return true;
    });

    const runId = `PAY-${Date.now()}`;
    const items: PayrollItem[] = [];

    for (const emp of targetEmployees) {
      const fac = factories.find((f) => f.id === emp.currentFactoryId);
      if (!fac) continue;

      // Filter attendance records within period
      const empAttendance = attendance.filter(
        (a) => a.employeeId === emp.id && a.date >= periodStart && a.date <= periodEnd
      );

      const boardingLoc = emp.boardingLocationId
        ? boardingLocations.find((b) => b.id === emp.boardingLocationId) || null
        : null;

      // Filter unallocated advances within this period
      const empAdvances = payments.filter(
        (p) =>
          p.employeeId === emp.id &&
          p.paymentType === 'advance' &&
          p.paymentDate >= periodStart &&
          p.paymentDate <= periodEnd
      );

      const item = PayrollService.calculateEmployeePayrollItem(
        emp,
        fac,
        empAttendance,
        boardingLoc,
        empAdvances,
        runId
      );

      items.push(item);
    }

    const totalGross = items.reduce((sum, it) => sum + it.grossEarnings, 0);
    const totalDeductions = items.reduce((sum, it) => sum + it.totalDeductions, 0);
    const totalNet = items.reduce((sum, it) => sum + it.netPayable, 0);

    const generatedRun: PayrollRun = {
      id: runId,
      payrollNumber: `PAY-${periodStart.slice(0, 7)}-${items.length}`,
      periodStart,
      periodEnd,
      generatedAt: new Date().toISOString(),
      status: 'draft',
      totalGross,
      totalDeductions,
      totalNet,
      totalPaid: 0,
      totalBalance: totalNet,
      items,
    };

    setPreviewRun(generatedRun);
    setFeedback(`Generated payroll breakdown for ${items.length} helpers.`);
  };

  const handleApprovePayroll = async () => {
    if (!previewRun) return;
    try {
      const approvedRun: PayrollRun = {
        ...previewRun,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser.name,
      };

      await savePayrollRun(approvedRun);
      setPreviewRun(approvedRun);
      setFeedback(`Payroll run #${approvedRun.payrollNumber} approved & finalized!`);
      setTimeout(() => setFeedback(''), 4000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForPayment || !previewRun) return;

    // Check every factory represented in this run before saving a payment record,
    // preventing a partial save when the payroll cloud-confirmation guard rejects
    // the subsequent run update.
    const runFactoryIds = Array.from(new Set(previewRun.items.map((item) => item.factoryId)));
    const unconfirmedFactoryNames = runFactoryIds
      .filter((factoryId) => !factories.some((factory) => factory.id === factoryId && factory.cloudSyncConfirmed === true))
      .map((factoryId) => factories.find((factory) => factory.id === factoryId)?.name || factoryId);
    if (unconfirmedFactoryNames.length > 0) {
      setFeedback(`Payment not recorded. Confirm the cloud-saved rates for: ${unconfirmedFactoryNames.join(', ')}.`);
      return;
    }

    if (paymentAmount <= 0) {
      alert('Payment amount must be greater than zero.');
      return;
    }

    if (paymentAmount > selectedItemForPayment.remainingBalance) {
      alert(
        `Payment amount (LKR ${paymentAmount}) cannot exceed remaining balance (LKR ${selectedItemForPayment.remainingBalance}).`
      );
      return;
    }

    try {
      const newPayment: EmployeePayment = {
        id: `PAY-REC-${Date.now()}`,
        employeeId: selectedItemForPayment.employeeId,
        employeeName: selectedItemForPayment.employeeName,
        payrollRunId: previewRun.id,
        payrollItemId: selectedItemForPayment.id,
        paymentType:
          paymentAmount === selectedItemForPayment.remainingBalance
            ? 'salary_payment'
            : 'partial_payment',
        amount: Number(paymentAmount),
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod,
        referenceNumber: paymentRef || `SLIP-${Date.now().toString().slice(-4)}`,
        notes: paymentNotes,
        recordedBy: currentUser.id,
        createdAt: new Date().toISOString(),
      };

      await savePayment(newPayment);

      // Update in memory preview
      const updatedItems = previewRun.items.map((it) => {
        if (it.id === selectedItemForPayment.id) {
          const newPaid = it.amountPaid + paymentAmount;
          const newBal = it.netPayable - newPaid;
          return {
            ...it,
            amountPaid: newPaid,
            remainingBalance: newBal,
            paymentStatus: (newBal === 0 ? 'paid' : 'partial') as any,
          };
        }
        return it;
      });

      const updatedPaidTotal = previewRun.totalPaid + paymentAmount;
      const updatedBalanceTotal = previewRun.totalNet - updatedPaidTotal;

      const updatedRun: PayrollRun = {
        ...previewRun,
        totalPaid: updatedPaidTotal,
        totalBalance: updatedBalanceTotal,
        status: updatedBalanceTotal === 0 ? 'paid' : previewRun.status,
        items: updatedItems,
      };

      await savePayrollRun(updatedRun);
      setPreviewRun(updatedRun);
      setSelectedItemForPayment(null);
      setFeedback(`Recorded payment of LKR ${paymentAmount} for ${selectedItemForPayment.employeeName}`);
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const exportPayrollExcel = async () => {
    if (!previewRun) {
      setFeedback('Calculate payroll first, then export the summary sheet.');
      return;
    }
    const headers = [
      'Payroll Number', 'Period Start', 'Period End', 'Payroll Status',
      'Helper ID', 'Full Name', 'Gender', 'Factory', 'Wage Arrangement',
      'Wage Rate (LKR)', 'Days Worked', 'Normal Wages (LKR)',
      'Approved OT Hours', 'OT Wages (LKR)', 'Gross Earnings (LKR)',
      'Meal Deductions (LKR)', 'Boarding Deductions (LKR)',
      'Advances Deducted (LKR)', 'Total Deductions (LKR)',
      'Net Payable (LKR)', 'Amount Paid (LKR)', 'Remaining Balance (LKR)',
    ];
    const rows = previewRun.items.map((item) => [
      previewRun.payrollNumber, previewRun.periodStart, previewRun.periodEnd, previewRun.status,
      item.employeeId, item.employeeName, item.employeeGender, item.factoryName, item.wageArrangement,
      item.snapshotWageRate, item.daysWorked, item.normalWage,
      item.approvedOtHours, item.otWage, item.grossEarnings,
      item.totalMealDeductions, item.totalBoardingDeductions,
      item.advancesDeducted, item.totalDeductions, item.netPayable,
      item.amountPaid, item.remainingBalance,
    ]);
    const workbook = createExcelXmlWorkbook('Payroll Summary', headers, rows);
    const safePayrollNumber = previewRun.payrollNumber.replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `Royal_Hires_Payroll_Summary_${safePayrollNumber}.xls`;
    try {
      await exportFile({
        fileName,
        data: workbook,
        mimeType: 'application/vnd.ms-excel',
        title: 'Royal Hires payroll summary sheet',
        dialogTitle: 'Save or share Excel payroll summary',
      });
      setFeedback(`Excel summary sheet prepared: ${fileName}`);
      window.setTimeout(() => setFeedback(''), 5000);
    } catch (error) {
      console.error('Payroll Excel export failed:', error);
      setFeedback(error instanceof Error ? `Excel summary export failed: ${error.message}` : 'Excel summary export failed. Please try again.');
    }
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Top Controller */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <span>Helper Payroll Processing Engine</span>
            </h2>
            <p className="text-xs text-slate-500">
              Calculate helper wages, approved overtime earnings, meal &amp; boarding deductions, advances, and partial payouts
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {previewRun && (
              <>
              <button onClick={() => { void exportPayslipsPdf(previewRun.items); }} className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg border border-emerald-200 flex items-center space-x-1 transition cursor-pointer">
                <Download className="w-3.5 h-3.5" /><span>Export Payslips PDF</span>
              </button>
              <button
                onClick={() => { void exportPayrollExcel(); }}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 flex items-center space-x-1 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel Summary</span>
              </button>
              </>
            )}
            <button
              onClick={handleGeneratePayroll}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Calculator className="w-4 h-4" />
              <span>Calculate Payroll</span>
            </button>
          </div>
        </div>

        {/* Payslip frequency and payroll period controls */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Payslip Frequency</label>
            <select value={payslipPeriodType} onChange={(e) => setPayslipPeriodType(e.target.value as 'weekly' | 'monthly')} className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2">
              <option value="weekly">Weekly</option><option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Period Start</label>
            <input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Period End</label>
            <input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Factory Filter</label>
            <select value={selectedFactoryId} onChange={(e) => setSelectedFactoryId(e.target.value)} className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2">
              <option value="all">All Factories</option>{factories.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>
        </div>

        {feedback && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{feedback}</span>
          </div>
        )}
      </div>

      {/* Generated Payroll Run Overview */}
      {previewRun ? (
        <div className="space-y-4">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold px-2.5 py-0.5 bg-slate-100 rounded text-slate-800">
                  {previewRun.payrollNumber}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    previewRun.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : previewRun.status === 'paid'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {previewRun.status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Covered Period: <strong className="text-slate-800">{previewRun.periodStart}</strong> to{' '}
                <strong className="text-slate-800">{previewRun.periodEnd}</strong> ({previewRun.items.length} Helpers)
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Net Payable</span>
                <span className="text-xl font-bold text-slate-900">
                  LKR {previewRun.totalNet.toLocaleString()}
                </span>
              </div>
              {previewRun.status === 'draft' && currentUser.role === 'admin' && (
                <button
                  onClick={handleApprovePayroll}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Approve &amp; Lock Payroll</span>
                </button>
              )}
            </div>
          </div>

          {/* Breakdown Table (Responsive Desktop & Mobile View) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">Helper</th>
                    <th className="p-3">Factory</th>
                    <th className="p-3">Days</th>
                    <th className="p-3">Normal Wage</th>
                    <th className="p-3">Approved OT</th>
                    <th className="p-3">Gross</th>
                    <th className="p-3">Meals</th>
                    <th className="p-3">Boarding</th>
                    <th className="p-3">Advances</th>
                    <th className="p-3 font-bold text-slate-900">Net Payable</th>
                    <th className="p-3">Paid</th>
                    <th className="p-3 font-bold text-rose-800">Balance</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {previewRun.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{item.employeeName}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.employeeId} • Helper ({item.employeeGender})
                        </div>
                      </td>
                      <td className="p-3 text-slate-500">{item.factoryName}</td>
                      <td className="p-3 font-semibold">{item.daysWorked}</td>
                      <td className="p-3">LKR {item.normalWage.toLocaleString()}</td>
                      <td className="p-3">
                        {item.approvedOtHours > 0 ? (
                          <div>
                            <span className="font-bold text-amber-700">{item.approvedOtHours}h</span>
                            <span className="text-[10px] text-slate-400 block">
                              +LKR {item.otWage.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">0h</span>
                        )}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        LKR {item.grossEarnings.toLocaleString()}
                      </td>
                      <td className="p-3 text-amber-800">
                        {item.totalMealDeductions > 0 ? `-LKR ${item.totalMealDeductions.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 text-blue-800">
                        {item.totalBoardingDeductions > 0
                          ? `-LKR ${item.totalBoardingDeductions.toLocaleString()}`
                          : '-'}
                      </td>
                      <td className="p-3 text-rose-800">
                        {item.advancesDeducted > 0 ? `-LKR ${item.advancesDeducted.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-3 font-bold text-emerald-800 bg-emerald-50/30">
                        LKR {item.netPayable.toLocaleString()}
                      </td>
                      <td className="p-3 text-slate-600">LKR {item.amountPaid.toLocaleString()}</td>
                      <td className="p-3 font-bold text-rose-800">
                        LKR {item.remainingBalance.toLocaleString()}
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <button onClick={() => { void exportPayslipsPdf([item]); }} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold">Payslip</button>
                        {item.remainingBalance > 0 ? (
                          <button
                            onClick={() => {
                              setSelectedItemForPayment(item);
                              setPaymentAmount(item.remainingBalance);
                            }}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-[11px] shadow-xs transition cursor-pointer"
                          >
                            Pay
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                            Fully Paid
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
          <Calculator className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No payroll run active in view.</p>
          <p className="text-xs text-slate-400 mt-1">
            Select dates above and click "Calculate Payroll" to generate an itemized breakdown.
          </p>
        </div>
      )}

      {/* Record Salary Payment / Partial Payment Modal */}
      {selectedItemForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center space-x-1.5">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>Disburse Salary / Partial Payment</span>
              </h3>
              <button
                onClick={() => setSelectedItemForPayment(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Helper:</span>
                <strong className="text-slate-800">{selectedItemForPayment.employeeName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Net Payable:</span>
                <span className="font-semibold text-slate-800">
                  LKR {selectedItemForPayment.netPayable.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-rose-800 font-bold pt-1 border-t border-slate-200">
                <span>Remaining Payable Balance:</span>
                <span>LKR {selectedItemForPayment.remainingBalance.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Disbursement Amount in LKR *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={selectedItemForPayment.remainingBalance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold text-base text-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Disbursement Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                >
                  <option value="cash">Cash in Hand</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Voucher / Slip Reference</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. SLIP-0988"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setSelectedItemForPayment(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
