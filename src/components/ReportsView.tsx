import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BarChart3,
  Download,
  Calendar,
  Building2,
  DollarSign,
  TrendingUp,
  Receipt,
  Users,
  Clock,
  Coffee,
  Home,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const {
    factories,
    employees,
    attendance,
    invoices,
    receipts,
    payrollRuns,
    payments,
    t,
  } = useApp();

  const [activeReport, setActiveReport] = useState<
    'pnl' | 'attendance' | 'payroll_summary' | 'invoices' | 'advances'
  >('pnl');

  const [filterFactory, setFilterFactory] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // P&L calculation factory-wise
  const targetFactories = filterFactory === 'all'
    ? factories
    : factories.filter((f) => f.id === filterFactory);

  const pnlData = targetFactories.map((fac) => {
    // 1. Invoices for this factory
    const facInvoices = invoices.filter(
      (inv) => inv.factoryId === fac.id && inv.periodStart >= startDate && inv.periodEnd <= endDate
    );
    const invoicedRevenue = facInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    const collectedCash = receipts
      .filter((r) => r.factoryId === fac.id && r.receiptDate >= startDate && r.receiptDate <= endDate)
      .reduce((sum, r) => sum + (r.amount || 0), 0);
    const outstandingInvoiceDue = facInvoices.reduce((sum, inv) => sum + (inv.outstandingBalance || 0), 0);

    // 2. Attendance at this factory
    const facAtt = attendance.filter(
      (a) => a.factoryId === fac.id && a.date >= startDate && a.date <= endDate
    );

    // Approved attendance days and OT hours
    const totalDaysWorked = facAtt.filter((a) => a.status === 'present' || a.status === 'half_day')
      .reduce((sum, a) => sum + a.payableUnits, 0);

    const approvedOtHours = facAtt.filter((a) => a.submissionStatus === 'approved')
      .reduce((sum, a) => sum + a.totalOtHours, 0);

    // Estimated Helper Payroll Costs (Wages + OT paid)
    let helperWageCost = 0;
    facAtt.forEach((a) => {
      const emp = employees.find((e) => e.id === a.employeeId);
      if (emp) {
        helperWageCost += a.payableUnits * emp.wageRate;
      }
    });

    const helperOtCost = approvedOtHours * fac.employeeOvertimeRateHourly;
    const totalLaborCost = helperWageCost + helperOtCost;

    // Estimated Agency Margin
    const estimatedGrossProfit = invoicedRevenue - totalLaborCost;
    const marginPct = invoicedRevenue > 0 ? ((estimatedGrossProfit / invoicedRevenue) * 100).toFixed(1) : '0.0';

    return {
      factory: fac,
      invoicedRevenue,
      collectedCash,
      outstandingInvoiceDue,
      totalDaysWorked,
      approvedOtHours,
      helperWageCost,
      helperOtCost,
      totalLaborCost,
      estimatedGrossProfit,
      marginPct,
    };
  });

  const grandTotalInvoiced = pnlData.reduce((s, p) => s + p.invoicedRevenue, 0);
  const grandTotalCollected = pnlData.reduce((s, p) => s + p.collectedCash, 0);
  const grandTotalLabor = pnlData.reduce((s, p) => s + p.totalLaborCost, 0);
  const grandTotalProfit = pnlData.reduce((s, p) => s + p.estimatedGrossProfit, 0);

  const exportCurrentReport = () => {
    if (startDate > endDate) {
      window.alert('Start date must be on or before end date.');
      return;
    }

    type ExportCell = string | number | boolean | null | undefined;
    let headers: string[] = [];
    let rows: ExportCell[][] = [];

    if (activeReport === 'pnl') {
      headers = [
        'Factory Name', 'Billing Method', 'Invoiced Revenue (LKR)',
        'Collected Receipts (LKR)', 'Outstanding Due (LKR)', 'Days Supplied',
        'Approved OT Hours', 'Helper Wages Cost (LKR)', 'Helper OT Cost (LKR)',
        'Total Labor Cost (LKR)', 'Estimated Profit (LKR)', 'Margin %',
      ];
      rows = pnlData.map((d) => [
        d.factory.name, d.factory.billingMethod, d.invoicedRevenue,
        d.collectedCash, d.outstandingInvoiceDue, d.totalDaysWorked,
        d.approvedOtHours, d.helperWageCost, d.helperOtCost,
        d.totalLaborCost, d.estimatedGrossProfit, d.marginPct,
      ]);
    } else if (activeReport === 'attendance') {
      headers = ['Date', 'Factory', 'Helper ID', 'Helper Name', 'Gender', 'Shift', 'Status', 'Days', 'OT Hours', 'Supervisor'];
      rows = attendance
        .filter((a) => (filterFactory === 'all' || a.factoryId === filterFactory) && a.date >= startDate && a.date <= endDate)
        .map((a) => [
          a.date, a.factoryName, a.employeeId, a.employeeName, a.employeeGender,
          a.shift, a.status, a.payableUnits, a.totalOtHours, a.supervisorName,
        ]);
    } else if (activeReport === 'payroll_summary') {
      headers = ['Payroll Number', 'Period Start', 'Period End', 'Run Status', 'Employee ID', 'Employee Name', 'Factory', 'Wage Arrangement', 'Days Worked', 'Approved OT Hours', 'Gross Earnings (LKR)', 'Total Deductions (LKR)', 'Net Payable (LKR)', 'Amount Paid (LKR)', 'Remaining Balance (LKR)'];
      rows = payrollRuns
        .filter((run) => run.periodStart <= endDate && run.periodEnd >= startDate)
        .flatMap((run) => run.items
          .filter((item) => filterFactory === 'all' || item.factoryId === filterFactory)
          .map((item) => [
            run.payrollNumber, run.periodStart, run.periodEnd, run.status,
            item.employeeId, item.employeeName, item.factoryName, item.wageArrangement,
            item.daysWorked, item.approvedOtHours, item.grossEarnings,
            item.totalDeductions, item.netPayable, item.amountPaid, item.remainingBalance,
          ]));
    } else if (activeReport === 'invoices') {
      headers = ['Invoice Number', 'Factory', 'Invoice Date', 'Period Start', 'Period End', 'Due Date', 'Status', 'Subtotal (LKR)', 'Adjustments (LKR)', 'Invoice Total (LKR)', 'Received (LKR)', 'Outstanding Balance (LKR)'];
      rows = invoices
        .filter((inv) =>
          (filterFactory === 'all' || inv.factoryId === filterFactory) &&
          inv.periodStart <= endDate && inv.periodEnd >= startDate
        )
        .map((inv) => [
          inv.invoiceNumber, inv.factoryName, inv.invoiceDate, inv.periodStart,
          inv.periodEnd, inv.dueDate, inv.status, inv.subtotal, inv.adjustments,
          inv.totalAmount, inv.amountReceived, inv.outstandingBalance,
        ]);
    } else if (activeReport === 'advances') {
      headers = ['Date', 'Employee ID', 'Employee Name', 'Factory', 'Transaction Type', 'Amount (LKR)', 'Payment Method', 'Reference', 'Notes'];
      rows = payments
        .filter((p) => p.paymentType === 'advance' && p.paymentDate >= startDate && p.paymentDate <= endDate)
        .filter((p) => {
          const employee = employees.find((e) => e.id === p.employeeId);
          return filterFactory === 'all' || employee?.currentFactoryId === filterFactory;
        })
        .map((p) => {
          const employee = employees.find((e) => e.id === p.employeeId);
          const factory = factories.find((f) => f.id === employee?.currentFactoryId);
          return [
            p.paymentDate, p.employeeId, p.employeeName, factory?.name || '',
            p.paymentType, p.amount, p.paymentMethod, p.referenceNumber || '', p.notes || '',
          ];
        });
    }

    if (rows.length === 0) {
      window.alert('There are no records for the selected report and date/factory filters.');
      return;
    }

    // Excel-compatible SpreadsheetML 2003 workbook. This is a real Excel-readable
    // workbook file and does not require adding a runtime dependency to the Android app.
    const xmlEscape = (value: ExportCell): string => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
    const xmlCell = (value: ExportCell): string => {
      const isNumber = typeof value === 'number' && Number.isFinite(value);
      const type = isNumber || typeof value === 'boolean' ? 'Number' : 'String';
      const normalized = typeof value === 'boolean' ? (value ? 1 : 0) : value;
      return `<Cell><Data ss:Type="${type}">${xmlEscape(normalized)}</Data></Cell>`;
    };
    const worksheetName = ({ pnl: 'Profit and Loss', attendance: 'Attendance', payroll_summary: 'Payroll Summary', invoices: 'Invoices', advances: 'Advances' } as const)[activeReport];
    const workbook = `<?xml version="1.0" encoding="UTF-8"?>
      <?mso-application progid="Excel.Sheet"?>
      <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:o="urn:schemas-microsoft-com:office:office"
        xmlns:x="urn:schemas-microsoft-com:office:excel"
        xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
        xmlns:html="http://www.w3.org/TR/REC-html40">
        <Worksheet ss:Name="${xmlEscape(worksheetName)}"><Table>
          <Row>${headers.map((header) => xmlCell(header)).join('')}</Row>
          ${rows.map((row) => `<Row>${row.map((cell) => xmlCell(cell)).join('')}</Row>`).join('')}
        </Table></Worksheet>
      </Workbook>`;
    const blob = new Blob(['\uFEFF', workbook], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RoyalPay_${activeReport}_${startDate}_${endDate}.xls`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>Operational &amp; Financial Reporting Engine</span>
          </h2>
          <p className="text-xs text-slate-500">
            Factory-wise Profit &amp; Loss, Attendance Registers, Billing, and Outstanding Balance Ledgers
          </p>
        </div>

        <button
          onClick={exportCurrentReport}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1.5 transition cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download Excel Summary (.xls)</span>
        </button>
      </div>

      {/* Filter and Tab Strip */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap gap-2 border-b pb-3">
          {[
            { id: 'pnl', label: 'Factory Profit & Loss (P&L)' },
            { id: 'attendance', label: 'Attendance Audit Register' },
            { id: 'payroll_summary', label: 'Payroll Summary' },
            { id: 'invoices', label: 'Invoices & Receivables' },
            { id: 'advances', label: 'Employee Advances Ledger' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                activeReport === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Factory Filter</label>
            <select
              value={filterFactory}
              onChange={(e) => setFilterFactory(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
            >
              <option value="all">All Factories</option>
              {factories.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Date Range Start</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Date Range End</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2"
            />
          </div>
        </div>
      </div>

      {/* REPORT CONTENT: P&L */}
      {activeReport === 'pnl' && (
        <div className="space-y-4">
          {/* Summary Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-400 block uppercase">Invoiced Revenue</span>
              <p className="text-xl font-bold text-slate-900 mt-1">LKR {grandTotalInvoiced.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-emerald-600 block uppercase font-medium">Collected Cash</span>
              <p className="text-xl font-bold text-emerald-800 mt-1">LKR {grandTotalCollected.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-rose-600 block uppercase font-medium">Helper Wages Cost</span>
              <p className="text-xl font-bold text-rose-800 mt-1">LKR {grandTotalLabor.toLocaleString()}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 shadow-xs">
              <span className="text-xs text-emerald-800 block uppercase font-bold">Estimated Gross Profit</span>
              <p className="text-xl font-bold text-emerald-950 mt-1">LKR {grandTotalProfit.toLocaleString()}</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <tr>
                    <th className="p-3">Factory</th>
                    <th className="p-3">Rate Method</th>
                    <th className="p-3 font-bold text-slate-900">Invoiced Revenue</th>
                    <th className="p-3 text-emerald-700">Collected Cash</th>
                    <th className="p-3 text-rose-700">Outstanding</th>
                    <th className="p-3">Days</th>
                    <th className="p-3">OT Hrs</th>
                    <th className="p-3 text-rose-800">Labor Cost</th>
                    <th className="p-3 font-bold text-emerald-900 text-right">Est. Gross Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {pnlData.map((d) => (
                    <tr key={d.factory.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-bold text-slate-900">{d.factory.name}</td>
                      <td className="p-3 text-[11px] text-slate-500">
                        {d.factory.billingMethod === 'SAME_RATE_FOR_ALL' ? 'Method A (Same)' : 'Method B (Male/Female)'}
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        LKR {d.invoicedRevenue.toLocaleString()}
                      </td>
                      <td className="p-3 font-semibold text-emerald-700">
                        LKR {d.collectedCash.toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-rose-800">
                        LKR {d.outstandingInvoiceDue.toLocaleString()}
                      </td>
                      <td className="p-3">{d.totalDaysWorked}</td>
                      <td className="p-3">{d.approvedOtHours}h</td>
                      <td className="p-3 text-rose-800">
                        LKR {d.totalLaborCost.toLocaleString()}
                      </td>
                      <td className="p-3 font-bold text-emerald-900 text-right">
                        LKR {d.estimatedGrossProfit.toLocaleString()} ({d.marginPct}%)
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: Attendance Audit */}
      {activeReport === 'attendance' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Factory</th>
                  <th className="p-3">Helper</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">OT Hours</th>
                  <th className="p-3">Meals (B/L/D)</th>
                  <th className="p-3">Supervisor</th>
                  <th className="p-3">Audit Approval</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attendance
                  .filter((a) => (filterFactory === 'all' || a.factoryId === filterFactory) && a.date >= startDate && a.date <= endDate)
                  .map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-semibold text-slate-900">{a.date}</td>
                      <td className="p-3 text-slate-500">{a.factoryName}</td>
                      <td className="p-3 font-bold text-slate-800">
                        {a.employeeName} ({a.employeeId})
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                            a.status === 'present'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="p-3 font-bold">{a.totalOtHours > 0 ? `${a.totalOtHours}h` : '-'}</td>
                      <td className="p-3 text-slate-500">
                        {[a.hadBreakfast ? 'B' : '', a.hadLunch ? 'L' : '', a.hadDinner ? 'D' : '']
                          .filter(Boolean)
                          .join(', ') || '-'}
                      </td>
                      <td className="p-3 text-slate-500">{a.supervisorName}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.submissionStatus === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {a.submissionStatus.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: Invoices & Receivables */}
      {activeReport === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Factory</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3">Total Billed</th>
                  <th className="p-3 text-emerald-700">Collected</th>
                  <th className="p-3 font-bold text-rose-800">Balance</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoices
                  .filter((i) => (filterFactory === 'all' || i.factoryId === filterFactory))
                  .map((inv) => (
                    <tr key={inv.id}>
                      <td className="p-3 font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="p-3 font-semibold text-slate-800">{inv.factoryName}</td>
                      <td className="p-3 text-slate-500">{inv.invoiceDate}</td>
                      <td className="p-3 text-slate-500">{inv.dueDate}</td>
                      <td className="p-3 font-bold text-slate-900">LKR {inv.totalAmount.toLocaleString()}</td>
                      <td className="p-3 text-emerald-700 font-semibold">LKR {inv.amountReceived.toLocaleString()}</td>
                      <td className="p-3 font-bold text-rose-800">LKR {inv.outstandingBalance.toLocaleString()}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {inv.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT CONTENT: Advances Ledger */}
      {activeReport === 'advances' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Helper Name</th>
                  <th className="p-3">Amount (LKR)</th>
                  <th className="p-3">Payment Method</th>
                  <th className="p-3">Reference</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {payments
                  .filter((p) => p.paymentType === 'advance')
                  .map((p) => (
                    <tr key={p.id}>
                      <td className="p-3 text-slate-500">{p.paymentDate}</td>
                      <td className="p-3 font-bold text-slate-900">{p.employeeName}</td>
                      <td className="p-3 font-bold text-amber-700">LKR {p.amount.toLocaleString()}</td>
                      <td className="p-3 capitalize">{p.paymentMethod}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500">{p.referenceNumber || '-'}</td>
                      <td className="p-3 text-slate-600">{p.notes || '-'}</td>
                      <td className="p-3 text-slate-400">{p.recordedBy}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
