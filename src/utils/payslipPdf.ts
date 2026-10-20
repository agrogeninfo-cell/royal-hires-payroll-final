import type { PayrollItem, PayrollRun } from '../types';

const ascii = (value: unknown): string => String(value ?? '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\x20-\x7E]/g, '?')
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)');

const money = (value: number): string => `LKR ${Number(value || 0).toLocaleString('en-US')}`;

function makePage(item: PayrollItem, run: PayrollRun, frequency: 'weekly' | 'monthly'): string {
  const lines = [
    'ROYAL HIRES PRIVATE LIMITED',
    'EMPLOYEE PAYSLIP',
    `${frequency.toUpperCase()} PAYSLIP`,
    '',
    `Payroll No: ${run.payrollNumber}`,
    `Period: ${run.periodStart} to ${run.periodEnd}`,
    `Employee: ${item.employeeName}`,
    `Employee ID: ${item.employeeId}`,
    `Factory: ${item.factoryName}`,
    `Wage Arrangement: ${item.wageArrangement}`,
    `Days Worked: ${item.daysWorked}`,
    '',
    'EARNINGS',
    `Normal Wages: ${money(item.normalWage)}`,
    `Approved Overtime (${item.approvedOtHours} hrs): ${money(item.otWage)}`,
    `Gross Earnings: ${money(item.grossEarnings)}`,
    '',
    'DEDUCTIONS',
    `Meals: ${money(item.totalMealDeductions)}`,
    `Boarding: ${money(item.totalBoardingDeductions)}`,
    `Salary Advances: ${money(item.advancesDeducted)}`,
    `Total Deductions: ${money(item.totalDeductions)}`,
    '',
    'PAYMENT SUMMARY',
    `NET PAYABLE: ${money(item.netPayable)}`,
    `Amount Paid: ${money(item.amountPaid)}`,
    `Remaining Balance: ${money(item.remainingBalance)}`,
    `Payment Status: ${item.paymentStatus}`,
    '',
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    'Employee Signature: _______________________',
    'Authorized By: ____________________________',
  ];

  const commands = [
    '0.7 w 42 800 m 553 800 l S',
    '0.7 w 42 44 m 553 44 l S',
  ];
  let y = 775;
  lines.forEach((line, index) => {
    const isHeader = index <= 2 || ['EARNINGS', 'DEDUCTIONS', 'PAYMENT SUMMARY'].includes(line);
    const font = isHeader ? 'F2' : 'F1';
    const size = index === 0 ? 15 : index === 1 ? 13 : index === 2 ? 10 : isHeader ? 11 : 9.5;
    const color = index <= 1 ? '0.02 0.37 0.27' : '0.10 0.15 0.18';
    commands.push(`BT /${font} ${size} Tf ${color} rg 45 ${y} Td (${ascii(line)}) Tj ET`);
    if (index === 0) commands.push('0.83 0.68 0.36 RG 1.5 w 42 752 m 553 752 l S');
    y -= index === 0 ? 26 : index === 1 ? 22 : index === 2 ? 22 : line === '' ? 10 : 18;
  });
  return commands.join('\n');
}

/** Creates a valid multi-page A4 PDF without browser print dialogs or pop-up permissions. */
export function createPayslipPdf(items: PayrollItem[], run: PayrollRun, frequency: 'weekly' | 'monthly'): string {
  if (!items.length) throw new Error('No employees are available to export as payslips.');
  const pages = items.map((item) => makePage(item, run, frequency));
  const objects: string[] = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  const pageIds = pages.map((_, index) => 3 + index * 2);
  const fontId = 3 + pages.length * 2;
  objects.push(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`);
  pages.forEach((stream, index) => {
    const pageId = 3 + index * 2;
    const streamId = pageId + 1;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${fontId + 1} 0 R >> >> /Contents ${streamId} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  let pdf = '%PDF-1.4\n% Royal Hires payslip export\n';
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return pdf;
}
