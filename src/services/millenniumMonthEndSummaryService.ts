import { AttendanceRecord, Factory } from '../types';
import { BillingService } from './billingService';

export const MILLENNIUM_OT_BILLING_RATE = 225;
export const MILLENNIUM_LATE_DEDUCTION_RATE = 150;

export interface MillenniumSummaryLine {
  date: string;
  gender: 'male' | 'female';
  dayShiftCount: number;
  dayRate: number;
  dayShiftTotal: number;
  approvedOtHours: number;
  otTotal: number;
  lateHours: number;
  lateDeduction: number;
  total: number;
}

export interface MillenniumGenderSummary {
  gender: 'male' | 'female';
  dayShiftCount: number;
  dayShiftTotal: number;
  approvedOtHours: number;
  otTotal: number;
  lateHours: number;
  lateDeduction: number;
  total: number;
  lines: MillenniumSummaryLine[];
}

export interface MillenniumMonthEndSummary {
  factoryId: string;
  factoryName: string;
  billingLabel: string;
  periodStart: string;
  periodEnd: string;
  male: MillenniumGenderSummary;
  female: MillenniumGenderSummary;
  grandTotal: number;
}

const toISODate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/** Billing cycle named by month-end: e.g. August 2026 = 25 Jul through 24 Aug. */
export function getMillenniumBillingPeriod(billingMonth: string): { start: string; end: string } {
  if (!/^\d{4}-\d{2}$/.test(billingMonth)) throw new Error('Billing month must use YYYY-MM format.');
  const [year, month] = billingMonth.split('-').map(Number);
  const firstOfBillingMonth = new Date(year, month - 1, 1);
  if (firstOfBillingMonth.getFullYear() !== year || firstOfBillingMonth.getMonth() !== month - 1) {
    throw new Error('Invalid billing month.');
  }
  const start = new Date(year, month - 2, 25);
  const end = new Date(year, month - 1, 24);
  return { start: toISODate(start), end: toISODate(end) };
}

const emptyGender = (gender: 'male' | 'female'): MillenniumGenderSummary => ({
  gender, dayShiftCount: 0, dayShiftTotal: 0, approvedOtHours: 0, otTotal: 0,
  lateHours: 0, lateDeduction: 0, total: 0, lines: [],
});

/**
 * Builds a Millennium Teas client-billing summary from approved attendance.
 * OT is billed at the workbook's stated LKR 225/hour. Late time is deducted at
 * the workbook's stated LKR 150/hour. This does not modify payroll or invoices.
 */
export function buildMillenniumMonthEndSummary(
  factory: Factory,
  attendance: AttendanceRecord[],
  billingMonth: string
): MillenniumMonthEndSummary {
  const key = `${factory.id} ${factory.name}`.toLowerCase();
  if (!key.includes('millennium teas') && !key.includes('millennium-teas')) {
    throw new Error('Millennium month-end summary can only be generated for Millennium Teas.');
  }
  const { start, end } = getMillenniumBillingPeriod(billingMonth);
  const summary: MillenniumMonthEndSummary = {
    factoryId: factory.id, factoryName: factory.name,
    billingLabel: new Date(Number(billingMonth.slice(0, 4)), Number(billingMonth.slice(5, 7)) - 1, 1)
      .toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
    periodStart: start, periodEnd: end,
    male: emptyGender('male'), female: emptyGender('female'), grandTotal: 0,
  };

  const records = attendance.filter((record) =>
    record.factoryId === factory.id &&
    record.date >= start && record.date <= end &&
    record.submissionStatus === 'approved' &&
    record.billable &&
    (record.status === 'present' || record.status === 'half_day') &&
    !/night/i.test(record.shift)
  );

  for (const record of records) {
    const genderSummary = record.employeeGender === 'male' ? summary.male : summary.female;
    const rate = BillingService.getApplicableDailyBillingRate(factory, record.employeeGender, record.date, record.shift).rate;
    const dayShiftCount = record.payableUnits;
    const dayShiftTotal = Math.round(dayShiftCount * rate);
    const approvedOtHours = Math.max(0, record.totalOtHours || 0);
    const otTotal = Math.round(approvedOtHours * MILLENNIUM_OT_BILLING_RATE);
    const lateHours = Math.max(0, record.lateHours || 0);
    const lateDeduction = Math.round(lateHours * MILLENNIUM_LATE_DEDUCTION_RATE);
    const total = dayShiftTotal + otTotal - lateDeduction;
    const line: MillenniumSummaryLine = {
      date: record.date, gender: record.employeeGender, dayShiftCount, dayRate: rate,
      dayShiftTotal, approvedOtHours, otTotal, lateHours, lateDeduction, total,
    };
    genderSummary.lines.push(line);
    genderSummary.dayShiftCount += dayShiftCount;
    genderSummary.dayShiftTotal += dayShiftTotal;
    genderSummary.approvedOtHours += approvedOtHours;
    genderSummary.otTotal += otTotal;
    genderSummary.lateHours += lateHours;
    genderSummary.lateDeduction += lateDeduction;
    genderSummary.total += total;
  }

  summary.grandTotal = summary.male.total + summary.female.total;
  return summary;
}

const csvCell = (value: string | number): string => {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Excel-compatible CSV export; keeps source attendance untouched. */
export function millenniumSummaryToCsv(summary: MillenniumMonthEndSummary): string {
  const rows: (string | number)[][] = [
    ['Millennium Teas - Month-End Billing Summary', summary.billingLabel],
    ['Billing Period', summary.periodStart, summary.periodEnd],
    [],
    ['Date', 'Labour Category', 'Day Shift Count', 'Rate', 'Day Shift Total', 'Approved OT Hours', 'OT Rate (LKR/hour)', 'OT Total', 'Late Hours', 'Late Rate (LKR/hour)', 'Late Deduction', 'Total (LKR)'],
  ];
  for (const group of [summary.male, summary.female]) {
    for (const line of group.lines) {
      rows.push([line.date, group.gender === 'male' ? 'Male' : 'Female', line.dayShiftCount, line.dayRate,
        line.dayShiftTotal, line.approvedOtHours, MILLENNIUM_OT_BILLING_RATE, line.otTotal,
        line.lateHours, MILLENNIUM_LATE_DEDUCTION_RATE, line.lateDeduction, line.total]);
    }
    rows.push([group.gender === 'male' ? 'Male Subtotal' : 'Female Subtotal', '', group.dayShiftCount, '',
      group.dayShiftTotal, group.approvedOtHours, MILLENNIUM_OT_BILLING_RATE, group.otTotal,
      group.lateHours, MILLENNIUM_LATE_DEDUCTION_RATE, group.lateDeduction, group.total]);
    rows.push([]);
  }
  rows.push(['GRAND TOTAL', '', summary.male.dayShiftCount + summary.female.dayShiftCount, '',
    summary.male.dayShiftTotal + summary.female.dayShiftTotal,
    summary.male.approvedOtHours + summary.female.approvedOtHours, MILLENNIUM_OT_BILLING_RATE,
    summary.male.otTotal + summary.female.otTotal, summary.male.lateHours + summary.female.lateHours,
    MILLENNIUM_LATE_DEDUCTION_RATE, summary.male.lateDeduction + summary.female.lateDeduction, summary.grandTotal]);
  return '\uFEFF' + rows.map((row) => row.map((cell) => csvCell(cell ?? '')).join(',')).join('\r\n');
}
