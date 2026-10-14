import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FactoryInvoice, InvoiceLineItem } from '../types';
import { InvoicingService } from '../services/invoicingService';
import {
  FileText,
  Plus,
  Eye,
  CheckCircle2,
  DollarSign,
  Calendar,
  Building2,
  Download,
  Send,
  Lock,
} from 'lucide-react';

export const InvoicesView: React.FC = () => {
  const {
    currentUser,
    factories,
    attendance,
    invoices,
    saveInvoice,
    t,
  } = useApp();

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<FactoryInvoice | null>(null);

  // Generation parameters
  const [targetFactoryId, setTargetFactoryId] = useState<string>(factories[0]?.id || '');
  const [periodStart, setPeriodStart] = useState<string>('2026-01-01');
  const [periodEnd, setPeriodEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>(`INV-2026-00${invoices.length + 1}`);
  const [feedback, setFeedback] = useState<string>('');

  React.useEffect(() => {
    if (!targetFactoryId && factories.length > 0) {
      setTargetFactoryId(factories[0].id);
    }
  }, [factories, targetFactoryId]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const fac = factories.find((f) => f.id === targetFactoryId);
    if (!fac) return;

    try {
      const newInvoice = InvoicingService.generateInvoiceFromAttendance(
        fac,
        periodStart,
        periodEnd,
        attendance,
        invoiceNumber,
        currentUser.name
      );

      if (newInvoice.lineItems.length === 0) {
        alert(
          `No approved billable attendance records found for "${fac.name}" between ${periodStart} and ${periodEnd}. Please ensure attendance is marked and overtime is approved by Admin.`
        );
        return;
      }

      await saveInvoice(newInvoice);
      setIsGenerateModalOpen(false);
      setSelectedInvoice(newInvoice);
      setFeedback(`Generated invoice #${newInvoice.invoiceNumber} with ${newInvoice.lineItems.length} lines.`);
      setTimeout(() => setFeedback(''), 4000);
    } catch (err: any) {
      alert(`Error generating invoice: ${err.message}`);
    }
  };

  const handleIssueInvoice = async (inv: FactoryInvoice) => {
    try {
      const issued: FactoryInvoice = {
        ...inv,
        status: 'issued',
        updatedAt: new Date().toISOString(),
      };
      await saveInvoice(issued);
      setSelectedInvoice(issued);
      setFeedback(`Issued invoice #${inv.invoiceNumber} to ${inv.factoryName}`);
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const exportInvoiceCsv = (inv: FactoryInvoice) => {
    const headers = [
      'Helper ID',
      'Name',
      'Gender',
      'Date',
      'Shift',
      'Rate Method Snapshot',
      'Snapshot Billing Rate (LKR)',
      'Billable Days',
      'Day Billing Total',
      'Approved OT Hours',
      'OT Rate (LKR/hr)',
      'OT Total',
      'Line Total (LKR)',
    ];

    // Escape every field consistently so commas, quotes, and line breaks in text
    // fields cannot shift the financial columns when opened in Excel.
    const escapeCsvCell = (value: unknown): string => {
      const text = value == null ? '' : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };

    const rows = inv.lineItems.map((l) => [
      l.employeeId,
      l.employeeName,
      l.employeeGender,
      l.date,
      l.shift,
      l.rateMethodSnapshot,
      l.snapshotBillingRate,
      l.billableDays,
      l.dayBillingTotal,
      l.approvedOtHours,
      l.snapshotOtBillingRateHourly,
      l.otBillingTotal,
      l.lineTotal,
    ]);

    // UTF-8 BOM improves Sinhala/Unicode compatibility in desktop Excel.
    // Blob URLs avoid the data-URL length/escaping limitations of the old export.
    const csvText = [headers, ...rows]
      .map((row) => row.map(escapeCsvCell).join(','))
      .join('\\r\\n');
    const blob = new Blob(['\\uFEFF', csvText], { type: 'text/csv;charset=utf-8;' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `Invoice_${inv.invoiceNumber.replace(/[^a-zA-Z0-9._-]/g, '_')}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Give WebView/browser download handling time to consume the Blob URL.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>Factory Billing &amp; Invoices Register</span>
          </h2>
          <p className="text-xs text-slate-500">
            Generate invoices from approved helper attendance with permanent immutable rate snapshots
          </p>
        </div>

        {currentUser.role !== 'supervisor' && (
          <button
            onClick={() => {
              setInvoiceNumber(`INV-2026-00${invoices.length + 1}`);
              setIsGenerateModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Factory Invoice</span>
          </button>
        )}
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-lg flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* Invoices List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Factory</th>
                <th className="p-3">Period</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Received</th>
                <th className="p-3 font-bold text-rose-800">Outstanding</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No factory invoices generated yet. Click "Generate Factory Invoice" to create one.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-bold text-slate-900">{inv.invoiceNumber}</td>
                    <td className="p-3 text-slate-700 font-semibold">{inv.factoryName}</td>
                    <td className="p-3 text-slate-500">
                      {inv.periodStart} to {inv.periodEnd}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      LKR {inv.totalAmount.toLocaleString()}
                    </td>
                    <td className="p-3 text-emerald-700 font-semibold">
                      LKR {inv.amountReceived.toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-rose-800">
                      LKR {inv.outstandingBalance.toLocaleString()}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'partially_paid'
                            ? 'bg-amber-100 text-amber-800'
                            : inv.status === 'issued'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {inv.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition cursor-pointer"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Generate Invoice Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Generate Factory Invoice</h3>
              <button
                onClick={() => setIsGenerateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice Number *</label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-bold uppercase"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Factory *</label>
                <select
                  value={targetFactoryId}
                  onChange={(e) => setTargetFactoryId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 font-semibold"
                >
                  {factories.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Period Start *</label>
                  <input
                    type="date"
                    required
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Period End *</label>
                  <input
                    type="date"
                    required
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Notice: Invoices compile only approved, billable attendance and overtime. Rates are locked immutably into invoice lines.
              </p>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Details & Printable View Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900">
                  Invoice #{selectedInvoice.invoiceNumber}
                </span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    selectedInvoice.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {selectedInvoice.status.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => exportInvoiceCsv(selectedInvoice)}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 flex items-center space-x-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
                {selectedInvoice.status === 'draft' && (
                  <button
                    onClick={() => handleIssueInvoice(selectedInvoice)}
                    className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center space-x-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Issue to Factory</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg ml-2"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Invoice Printable Layout Header */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">LankaManpower Agency Ltd</h4>
                <p className="text-slate-500">Industrial Manpower Supply Division</p>
                <p className="text-slate-500">Colombo, Sri Lanka • Tel: +94 11 291 0000</p>
              </div>
              <div className="text-right space-y-1">
                <p>
                  <strong>Billed To:</strong> {selectedInvoice.factoryName}
                </p>
                <p>
                  <strong>Billing Period:</strong> {selectedInvoice.periodStart} to {selectedInvoice.periodEnd}
                </p>
                <p>
                  <strong>Due Date:</strong> {selectedInvoice.dueDate}
                </p>
              </div>
            </div>

            {/* Immutability Notice */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Rate Snapshot Active: Line items retain the applicable daily rate and method captured at the time of invoice creation.
              </span>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-2.5">Date</th>
                    <th className="p-2.5">Helper</th>
                    <th className="p-2.5">Rate Method</th>
                    <th className="p-2.5">Daily Rate (LKR)</th>
                    <th className="p-2.5">Days</th>
                    <th className="p-2.5">Day Charge</th>
                    <th className="p-2.5">OT Hours</th>
                    <th className="p-2.5">OT Charge</th>
                    <th className="p-2.5 font-bold text-slate-900 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedInvoice.lineItems.map((line) => (
                    <tr key={line.id} className="hover:bg-slate-50/50">
                      <td className="p-2.5">{line.date}</td>
                      <td className="p-2.5 font-semibold text-slate-900">
                        {line.employeeName} ({line.employeeGender === 'male' ? 'M' : 'F'})
                      </td>
                      <td className="p-2.5 text-[10px] text-slate-500">
                        {line.rateMethodSnapshot === 'SAME_RATE_FOR_ALL' ? 'Method A' : 'Method B'}
                      </td>
                      <td className="p-2.5 font-semibold">LKR {line.snapshotBillingRate.toLocaleString()}</td>
                      <td className="p-2.5">{line.billableDays}</td>
                      <td className="p-2.5">LKR {line.dayBillingTotal.toLocaleString()}</td>
                      <td className="p-2.5">{line.approvedOtHours > 0 ? `${line.approvedOtHours}h` : '-'}</td>
                      <td className="p-2.5">
                        {line.otBillingTotal > 0 ? `LKR ${line.otBillingTotal.toLocaleString()}` : '-'}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900 text-right">
                        LKR {line.lineTotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end text-xs">
              <div className="w-64 space-y-2 border-t pt-2">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>LKR {selectedInvoice.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm border-t pt-1">
                  <span>Total Invoice Amount:</span>
                  <span>LKR {selectedInvoice.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Amount Received:</span>
                  <span>LKR {selectedInvoice.amountReceived.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-rose-800 text-sm border-t pt-1">
                  <span>Outstanding Balance:</span>
                  <span>LKR {selectedInvoice.outstandingBalance.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
