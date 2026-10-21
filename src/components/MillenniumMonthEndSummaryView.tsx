import React, { useMemo, useState } from 'react';
import { AttendanceRecord, Factory } from '../types';
import { buildMillenniumMonthEndSummary, millenniumSummaryToCsv } from '../services/millenniumMonthEndSummaryService';
import { Download, CalendarDays } from 'lucide-react';

interface Props { factories: Factory[]; attendance: AttendanceRecord[]; }

export const MillenniumMonthEndSummaryView: React.FC<Props> = ({ factories, attendance }) => {
  const factory = factories.find((item) => {
    const key = `${item.id} ${item.name}`.toLowerCase();
    return key.includes('millennium teas') || key.includes('millennium-teas');
  });
  const [billingMonth, setBillingMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const summary = useMemo(() => {
    if (!factory) return null;
    try { return buildMillenniumMonthEndSummary(factory, attendance, billingMonth); }
    catch (error) { console.error('Millennium summary calculation failed', error); return null; }
  }, [factory, attendance, billingMonth]);

  const exportCsv = () => {
    if (!summary) return;
    const blob = new Blob([millenniumSummaryToCsv(summary)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Millennium_Teas_Billing_Summary_${billingMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  const money = (amount: number) => `LKR ${amount.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (!factory) return <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">Millennium Teas factory configuration was not found in the currently accessible factory records.</div>;
  if (!summary) return <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-900">Summary could not be calculated. Please check approved attendance and factory billing rates.</div>;

  return <div className="space-y-4">
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
      <div>
        <h3 className="font-bold text-slate-900 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-emerald-600" />Millennium Teas Month-End Summary</h3>
        <p className="mt-1 text-xs text-slate-500">Billing cycle: 25th of previous month through 24th of selected month, inclusive.</p>
      </div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-xs font-semibold text-slate-600">Billing month
          <input type="month" value={billingMonth} onChange={(event) => setBillingMonth(event.target.value)} className="mt-1 block rounded-lg border border-slate-300 bg-slate-50 p-2 text-sm" />
        </label>
        <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600"><Download className="h-4 w-4" />Export Excel-compatible CSV</button>
      </div>
    </div>
    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <p className="text-xs font-semibold uppercase text-emerald-800">{summary.billingLabel} billing period</p>
      <p className="mt-1 text-lg font-bold text-emerald-950">{summary.periodStart} — {summary.periodEnd}</p>
      <p className="mt-1 text-xs text-emerald-800">Only approved, billable, non-night-shift attendance is included. OT is billed at Rs. 225/hour; late deductions are Rs. 150/hour based on the supplied workbook headings.</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {[{label:'Male Subtotal',value:summary.male.total},{label:'Female Subtotal',value:summary.female.total},{label:'Grand Total',value:summary.grandTotal}].map((item) => <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{item.label}</p><p className="mt-1 text-xl font-bold text-slate-900">{money(item.value)}</p></div>)}
    </div>
    {[summary.male, summary.female].map((group) => <div key={group.gender} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="border-b border-slate-200 bg-slate-50 p-3 font-bold capitalize text-slate-800">{group.gender} labour summary</div>
      <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-white text-slate-500"><tr>{['Date','Day Count','Rate','Day Total','OT Hours','OT Total','Late Hours','Late Deduction','Total'].map((label) => <th key={label} className="whitespace-nowrap p-3">{label}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">{group.lines.map((line, index) => <tr key={`${line.date}-${index}`}><td className="whitespace-nowrap p-3">{line.date}</td><td className="p-3">{line.dayShiftCount}</td><td className="p-3">{money(line.dayRate)}</td><td className="p-3">{money(line.dayShiftTotal)}</td><td className="p-3">{line.approvedOtHours}</td><td className="p-3">{money(line.otTotal)}</td><td className="p-3">{line.lateHours}</td><td className="p-3">{money(line.lateDeduction)}</td><td className="p-3 font-semibold">{money(line.total)}</td></tr>)}
      <tr className="bg-slate-50 font-bold"><td className="p-3">Subtotal</td><td className="p-3">{group.dayShiftCount}</td><td className="p-3">—</td><td className="p-3">{money(group.dayShiftTotal)}</td><td className="p-3">{group.approvedOtHours}</td><td className="p-3">{money(group.otTotal)}</td><td className="p-3">{group.lateHours}</td><td className="p-3">{money(group.lateDeduction)}</td><td className="p-3">{money(group.total)}</td></tr>
      {group.lines.length === 0 && <tr><td colSpan={9} className="p-4 text-center text-slate-500">No approved billable records in this billing period.</td></tr>}</tbody></table></div>
    </div>)}
  </div>;
};
