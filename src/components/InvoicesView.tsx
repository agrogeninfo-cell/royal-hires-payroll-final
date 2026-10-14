import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { FactoryInvoice, InvoiceLineItem } from '../types';
import { ROYAL_HIRES_LETTERHEAD_DATA_URI } from '../assets/royalHiresLetterhead';
import { InvoicingService } from '../services/invoicingService';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
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
  const [periodStart, setPeriodStart] = useState<string>(() => `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`);
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

  const exportInvoiceCsv = async (inv: FactoryInvoice) => {
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
      .join('\r\n');
    const fileName = `Invoice_${inv.invoiceNumber.replace(/[^a-zA-Z0-9._-]/g, '_')}.csv`;
    const csvWithBom = `\uFEFF${csvText}`;

    try {
      if (Capacitor.isNativePlatform()) {
        // Android WebView does not reliably download Blob URLs. Save a real file
        // in app cache and invoke the native share sheet so the user can save it.
        const saved = await Filesystem.writeFile({
          path: fileName,
          data: csvWithBom,
          directory: Directory.Cache,
          recursive: true,
        });
        await Share.share({
          title: `Export invoice ${inv.invoiceNumber}`,
          text: `Invoice ${inv.invoiceNumber} CSV export`,
          url: saved.uri,
          dialogTitle: 'Save or share invoice CSV',
        });
      } else {
        const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
      }
      setFeedback(`CSV export prepared: ${fileName}`);
      window.setTimeout(() => setFeedback(''), 4000);
    } catch (error) {
      console.error('Invoice CSV export failed', error);
      alert('Could not export the invoice CSV. Please try again or check Android sharing permissions.');
    }
  };

  const htmlEscape = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));

  const exportInvoiceLetterheadPdf = (inv: FactoryInvoice) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) { alert('Allow pop-ups to export the invoice as a PDF.'); return; }
    const lineRows = inv.lineItems.map((line) => `<tr><td>${htmlEscape(line.date)}</td><td>${htmlEscape(line.employeeName)} (${line.employeeGender === 'male' ? 'M' : 'F'})</td><td>${htmlEscape(line.shift)}</td><td class="num">${line.billableDays}</td><td class="num">${line.snapshotBillingRate.toLocaleString('en-LK')}</td><td class="num">${line.dayBillingTotal.toLocaleString('en-LK')}</td><td class="num">${line.approvedOtHours}</td><td class="num">${line.otBillingTotal.toLocaleString('en-LK')}</td><td class="num">${line.lineTotal.toLocaleString('en-LK')}</td></tr>`).join('');
    printWindow.document.open();
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${htmlEscape(inv.invoiceNumber)}</title><style>
      @page{size:A4;margin:0}*{box-sizing:border-box}html,body{margin:0;padding:0;font-family:Arial,sans-serif;color:#1f2937;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .letterhead{position:fixed;left:0;top:0;width:210mm;height:297mm;z-index:-1}main{padding:48mm 14mm 24mm;min-height:297mm;font-size:10px}.meta{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}.meta h1{font-size:19px;margin:0 0 6px;color:#0f3d2e}.meta p{margin:3px 0}.invoice-label{font-size:10px;letter-spacing:1.5px;color:#8b6b32;font-weight:bold}table{width:100%;border-collapse:collapse;margin-top:16px;font-size:9px}th{background:#0f3d2e;color:#fff;text-align:left;padding:7px 5px}td{border-bottom:1px solid #d1d5db;padding:6px 5px;vertical-align:top}.num{text-align:right;white-space:nowrap}.totals{margin:16px 0 0 auto;width:68mm;border-top:2px solid #0f3d2e;padding-top:8px}.total{font-size:14px;font-weight:bold;color:#0f3d2e;display:flex;justify-content:space-between;margin-top:8px}.notes{margin-top:18px;font-size:9px;color:#4b5563}.signature{display:flex;justify-content:space-between;margin-top:28mm;font-size:9px}.signature span{border-top:1px solid #64748b;padding-top:5px;width:58mm}@media screen{body{background:#e5e7eb}.letterhead{opacity:.95}main{background:transparent;max-width:210mm;margin:auto}}
      </style></head><body><img class="letterhead" src="${ROYAL_HIRES_LETTERHEAD_DATA_URI}" alt="Royal Hires letterhead"><main><div class="invoice-label">SERVICE INVOICE</div><div class="meta"><div><h1>INVOICE</h1><p><b>Invoice No:</b> ${htmlEscape(inv.invoiceNumber)}</p><p><b>Invoice Date:</b> ${htmlEscape(inv.invoiceDate)}</p><p><b>Status:</b> ${htmlEscape(inv.status.toUpperCase())}</p></div><div><p><b>Billed To:</b> ${htmlEscape(inv.factoryName)}</p><p><b>Billing Period:</b> ${htmlEscape(inv.periodStart)} to ${htmlEscape(inv.periodEnd)}</p><p><b>Due Date:</b> ${htmlEscape(inv.dueDate)}</p></div></div><table><thead><tr><th>Date</th><th>Employee</th><th>Shift</th><th class="num">Days</th><th class="num">Rate (LKR)</th><th class="num">Day Total</th><th class="num">OT Hours</th><th class="num">OT Total</th><th class="num">Line Total</th></tr></thead><tbody>${lineRows}</tbody></table><div class="totals"><div><b>Subtotal:</b> <span style="float:right">LKR ${inv.subtotal.toLocaleString('en-LK')}</span></div><div><b>Adjustments:</b> <span style="float:right">LKR ${inv.adjustments.toLocaleString('en-LK')}</span></div><div class="total"><span>TOTAL</span><span>LKR ${inv.totalAmount.toLocaleString('en-LK')}</span></div><div style="margin-top:8px"><b>Received:</b> <span style="float:right">LKR ${inv.amountReceived.toLocaleString('en-LK')}</span></div><div><b>Outstanding:</b> <span style="float:right">LKR ${inv.outstandingBalance.toLocaleString('en-LK')}</span></div></div><div class="notes">Rates are the invoice-time snapshots. Please quote the invoice number when making payment.${inv.notes ? `<br>${htmlEscape(inv.notes)}` : ''}</div><div class="signature"><span>Prepared by / Authorized Signature</span><span>Factory Acknowledgement</span></div></main><script>window.onload=()=>setTimeout(()=>window.print(),500);</script></body></html>`);
    printWindow.document.close();
  };

  const exportMillenniumSummaryCsv = async (inv: Pick<FactoryInvoice, 'factoryId' | 'periodStart' | 'periodEnd' | 'invoiceNumber'>) => {
    const records = (await Promise.resolve(attendance)).filter((record) => record.factoryId === inv.factoryId && record.date >= inv.periodStart && record.date <= inv.periodEnd && record.submissionStatus === 'approved' && (record.status === 'present' || record.status === 'half_day'));
    const escapeCell = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const csvRows: unknown[][] = [['Invoice No:', inv.invoiceNumber], [], ['Labour catagery : Male'], [], ['Date', 'Day Shift Count', 'Rate (7.00-19.00)', 'Day Shift Total', 'Night Shift Count', 'Rate (20:30-8:00)', 'Night Shift Total', 'OT Hours', 'Total OT Rs 225 (Per Hours)', 'Late Rs 150 (Per Hours)', 'Total']];
    const factory = factories.find((item) => item.id === inv.factoryId);
    const categories: Array<{ key: 'male' | 'female'; label: string; rate: number; nightRate?: number }> = [{ key: 'male', label: 'Male', rate: factory?.maleRate || 3000, nightRate: factory?.nightMaleRate }, { key: 'female', label: 'Female', rate: factory?.femaleRate || 2500, nightRate: factory?.nightFemaleRate }];
    const dates = [...new Set(records.map((record) => record.date))].sort();
    for (const category of categories) {
      if (category.key === 'female') csvRows.push([], [`Labour catagery : ${category.label}`], [], ['Date', 'Day Shift Count', 'Rate (7.00-19.00)', 'Day Shift Total', 'Night Shift Count', 'Rate (20:30-8:00)', 'Night Shift Total', 'OT Hours', 'Total OT Rs 225 (Per Hours)', 'Late Rs 150 (Per Hours)', 'Total']);
      for (const date of dates) {
        const daily = records.filter((record) => record.date === date && record.employeeGender === category.key);
        if (!daily.length) continue;
        const dayRecords = daily.filter((record) => /day|07:00|7\.00/i.test(record.shift) && !/night/i.test(record.shift));
        const nightRecords = daily.filter((record) => /night|20:30/i.test(record.shift));
        const dayCount = dayRecords.length;
        const nightCount = nightRecords.length;
        const dayTotal = dayCount * category.rate;
        const otHours = daily.reduce((sum, record) => sum + (record.totalOtHours || 0), 0);
        const otTotal = Math.round(otHours * 225);
        const lateHours = daily.reduce((sum, record) => sum + (record.lateHours || 0), 0);
        const lateTotal = Math.round(lateHours * 150);
        const nightTotal = nightCount && category.nightRate ? nightCount * category.nightRate : '';
        const total = nightCount > 0 && !category.nightRate ? '' : dayTotal + (typeof nightTotal === 'number' ? nightTotal : 0) + otTotal - lateTotal;
        csvRows.push([date.replace(/-/g, ','), dayCount || '', dayCount ? category.rate : '', dayCount ? dayTotal : '', nightCount || '', nightCount && category.nightRate ? category.nightRate : '', nightTotal, otHours || '', otHours ? otTotal : '', lateHours ? lateTotal : '', total]);
      }
    }
    csvRows.push([], ['Note:', 'Night-shift rate is blank unless an Admin configures it in Factory Management. Rows with night attendance and no configured night rate have a blank Total; do not bill them until the rate is approved.']);
    const csv = `\uFEFF${csvRows.map((row) => row.map(escapeCell).join(',')).join('\r\n')}`;
    const fileName = `Millennium_Teas_Summary_${inv.invoiceNumber.replace(/[^a-zA-Z0-9._-]/g, '_')}.csv`;
    try {
      if (Capacitor.isNativePlatform()) {
        const saved = await Filesystem.writeFile({ path: fileName, data: csv, directory: Directory.Cache, recursive: true });
        await Share.share({ title: `Millennium Teas Summary ${inv.invoiceNumber}`, text: 'Millennium Teas daily labour summary CSV', url: saved.uri, dialogTitle: 'Save or share summary CSV' });
      } else {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = fileName; link.click(); URL.revokeObjectURL(url);
      }
      setFeedback(`Millennium Teas summary exported: ${fileName}`);
    } catch (error) { console.error('Millennium summary export failed', error); alert('Could not export the Millennium Teas summary CSV.'); }
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

              <div className="flex justify-end flex-wrap gap-2 pt-3 border-t">
                {factories.find((factory) => factory.id === targetFactoryId)?.name.trim().toLowerCase() === 'millennium teas' && (
                  <button
                    type="button"
                    onClick={() => void exportMillenniumSummaryCsv({ factoryId: targetFactoryId, periodStart, periodEnd, invoiceNumber })}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold cursor-pointer"
                  >
                    Export Millennium Summary CSV
                  </button>
                )}
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

              <div className="flex items-center space-x-2 flex-wrap justify-end gap-2">
                <button onClick={() => exportInvoiceLetterheadPdf(selectedInvoice)} className="px-3 py-1.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg flex items-center space-x-1 cursor-pointer"><Download className="w-3.5 h-3.5" /><span>Export Letterhead PDF</span></button>
                {selectedInvoice.factoryName.trim().toLowerCase() === 'millennium teas' && <button onClick={() => void exportMillenniumSummaryCsv(selectedInvoice)} className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white rounded-lg flex items-center space-x-1 cursor-pointer"><Download className="w-3.5 h-3.5" /><span>Millennium Summary CSV</span></button>}
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
                <h4 className="font-bold text-slate-900 text-sm">Royal Hires Private Limited</h4>
                <p className="text-slate-500">Manpower & Workforce Solutions</p>
                <p className="text-slate-500">No.235/S Artigala Road, Meegoda • Tel: 071 144 244 5</p>
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
