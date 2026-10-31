import {
  Factory,
  AttendanceRecord,
  FactoryInvoice,
  InvoiceLineItem,
  FactoryReceipt,
  ReceiptAllocation,
} from '../types';
import { BillingService } from './billingService';

export class InvoicingService {
  /**
   * Generates a factory invoice from approved billable attendance records.
   * Locks in rate snapshots permanently.
   */
  public static generateInvoiceFromAttendance(
    factory: Factory,
    periodStart: string,
    periodEnd: string,
    attendanceRecords: AttendanceRecord[],
    invoiceNumber: string,
    createdBy: string
  ): FactoryInvoice {
    const lineItems: InvoiceLineItem[] = [];

    // Filter only records that belong to this factory, within period, and are approved
    const validAttendance = attendanceRecords.filter((att) => {
      return (
        att.factoryId === factory.id &&
        att.date >= periodStart &&
        att.date <= periodEnd &&
        att.submissionStatus === 'approved' &&
        (att.status === 'present' || att.status === 'half_day')
      );
    });

    for (const att of validAttendance) {
      // Get the applicable billing rate snapshot for this factory and employee gender
      const rateResult = BillingService.getApplicableDailyBillingRate(
        factory,
        att.employeeGender,
        att.date,
        att.shift
      );

      const billableDays = att.payableUnits;
      const dayBillingTotal = Math.round(billableDays * rateResult.rate);

      // Overtime charge using factory overtime billing rate
      const approvedOtHours = att.totalOtHours || 0;
      const normalizedShift = String(att.shift || '').toLowerCase().replace(/\\s+/g, '');
      const isDoubleShift = normalizedShift.includes('d+n')
        || normalizedShift.includes('day+night')
        || normalizedShift.includes('dayandnight')
        || normalizedShift.includes('double');
      const shiftCount = isDoubleShift
        ? Math.max(2, Number(att.payableUnits ?? 1))
        : Math.max(0, Number(att.payableUnits ?? 1));
      const dateValue = new Date(`${att.date}T12:00:00`);
      const isSundayOrPoya = dateValue.getDay() === 0
        || Boolean(factory.specialBillingDates?.includes(att.date));
      const mandatoryOtHoursPerShift = isSundayOrPoya
        ? Number(factory.sundayPoyaOtHoursPerShift ?? factory.mandatoryOtHoursPerShift ?? 0)
        : Number(factory.mandatoryOtHoursPerShift ?? 0);
      const mandatoryBillableOtHours = mandatoryOtHoursPerShift * shiftCount;
      const billableOtHours = Math.max(approvedOtHours, mandatoryBillableOtHours);
      const overtimeCharge = BillingService.calculateOvertimeBillingCharge(factory, billableOtHours, att.date);
      const snapshotOtBillingRateHourly = overtimeCharge.otBillingRateHourly;
      const otBillingTotal = overtimeCharge.amount;

      const lineTotal = dayBillingTotal + otBillingTotal;

      lineItems.push({
        id: `INV-LINE-${att.id}`,
        attendanceId: att.id,
        employeeId: att.employeeId,
        employeeName: att.employeeName,
        employeeGender: att.employeeGender,
        date: att.date,
        shift: att.shift,
        rateMethodSnapshot: rateResult.method,
        snapshotBillingRate: rateResult.rate,
        billableDays,
        dayBillingTotal,
        approvedOtHours,
        billableOtHours,
        snapshotOtBillingRateHourly,
        otBillingTotal,
        lineTotal,
      });
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);

    // Attendance bonus is a factory invoice charge only. Count unique calendar dates
    // per employee so a D+N double shift on one date still counts as one attendance day.
    const bonusThreshold = Math.max(1, Number(factory.attendanceBonusDays ?? 21));
    const bonusPerEmployee = Math.max(0, Number(factory.attendanceBonus ?? 0));
    const dateCreditsByEmployee = new Map<string, Map<string, number>>();
    validAttendance.forEach((att) => {
      const units = Math.max(0, Number(att.payableUnits ?? (att.status === 'half_day' ? 0.5 : att.status === 'present' ? 1 : 0)));
      if (units <= 0) return;
      const dateCredits = dateCreditsByEmployee.get(att.employeeId) || new Map<string, number>();
      // Multiple shifts on one calendar date (D+N) are capped at one bonus day.
      dateCredits.set(att.date, Math.max(dateCredits.get(att.date) || 0, Math.min(1, units)));
      dateCreditsByEmployee.set(att.employeeId, dateCredits);
    });
    const attendanceBonusEligibleEmployees = bonusPerEmployee > 0
      ? Array.from(dateCreditsByEmployee.values()).filter((dates) =>
          Array.from(dates.values()).reduce((sum, units) => sum + units, 0) >= bonusThreshold
        ).length
      : 0;
    const attendanceBonusTotal = attendanceBonusEligibleEmployees * bonusPerEmployee;
    const adjustments = 0;
    const totalAmount = subtotal + attendanceBonusTotal + adjustments;

    // Due date standard 14 days after period end
    const dueDateObj = new Date(periodEnd);
    dueDateObj.setDate(dueDateObj.getDate() + 14);
    const dueDate = dueDateObj.toISOString().split('T')[0];

    return {
      id: `INV-${Date.now()}`,
      invoiceNumber,
      factoryId: factory.id,
      factoryName: factory.name,
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate,
      periodStart,
      periodEnd,
      lineItems,
      subtotal,
      attendanceBonusEligibleEmployees,
      attendanceBonusTotal,
      adjustments,
      totalAmount,
      amountReceived: 0,
      outstandingBalance: totalAmount,
      status: 'draft',
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Safely allocates a receipt amount across one or more invoices.
   * Guarantees no over-allocation or duplicate allocations.
   */
  public static allocateReceipt(
    receipt: FactoryReceipt,
    invoice: FactoryInvoice,
    allocationAmount: number,
    allocatedBy: string
  ): { updatedReceipt: FactoryReceipt; updatedInvoice: FactoryInvoice } {
    if (allocationAmount <= 0) {
      throw new Error('Allocation amount must be greater than zero.');
    }

    if (allocationAmount > receipt.unallocatedAmount) {
      throw new Error(
        `Cannot allocate LKR ${allocationAmount}. Receipt only has LKR ${receipt.unallocatedAmount} available.`
      );
    }

    if (allocationAmount > invoice.outstandingBalance) {
      throw new Error(
        `Cannot allocate LKR ${allocationAmount}. Invoice outstanding balance is only LKR ${invoice.outstandingBalance}.`
      );
    }

    const newAllocation: ReceiptAllocation = {
      id: `ALLOC-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      receiptId: receipt.id,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amountAllocated: allocationAmount,
      allocatedAt: new Date().toISOString(),
      allocatedBy,
    };

    const updatedReceipt: FactoryReceipt = {
      ...receipt,
      unallocatedAmount: receipt.unallocatedAmount - allocationAmount,
      allocations: [...receipt.allocations, newAllocation],
    };

    const newAmountReceived = invoice.amountReceived + allocationAmount;
    const newOutstanding = Math.max(0, invoice.totalAmount - newAmountReceived);
    const newStatus =
      newOutstanding === 0
        ? 'paid'
        : newAmountReceived > 0
        ? 'partially_paid'
        : invoice.status;

    const updatedInvoice: FactoryInvoice = {
      ...invoice,
      amountReceived: newAmountReceived,
      outstandingBalance: newOutstanding,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    return { updatedReceipt, updatedInvoice };
  }
}
