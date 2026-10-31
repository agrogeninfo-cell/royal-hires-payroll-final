import {
  Employee,
  Factory,
  AttendanceRecord,
  BoardingLocation,
  EmployeePayment,
  PayrollItem,
} from '../types';

const DEFAULT_LATE_DEDUCTION_RATE_PER_HOUR = 150;

export class PayrollService {
  /**
   * Calculates a single employee's payroll line item for a given period.
   * Wage rates are kept separate from factory billing rates. Approved OT only
   * is paid; meal, boarding, late and advance deductions remain itemized.
   */
  public static calculateEmployeePayrollItem(
    employee: Employee,
    factory: Factory,
    attendanceList: AttendanceRecord[],
    boardingLocation: BoardingLocation | null,
    advances: EmployeePayment[],
    payrollRunId: string
  ): PayrollItem {
    const payableUnitsFor = (att: AttendanceRecord): number => {
      const normalizedShift = String(att.shift || '').toLowerCase().replace(/\s+/g, '');
      const isDoubleShift = normalizedShift.includes('d+n')
        || normalizedShift.includes('day+night')
        || normalizedShift.includes('dayandnight')
        || normalizedShift.includes('double');
      if (att.status === 'present') {
        const units = Math.max(0, Number(att.payableUnits ?? 1));
        return isDoubleShift ? Math.max(2, units) : units;
      }
      if (att.status === 'half_day') return isDoubleShift ? 1 : 0.5;
      return 0;
    };

    const payableDaysWorked = attendanceList.reduce((sum, att) => sum + payableUnitsFor(att), 0);

    // Empire Teas uses separate daily wages for weekdays, Saturdays and Sundays/Poya.
    // Other factories continue to use the employee's approved gender-specific wage.
    let normalWage = 0;
    if (employee.wageArrangement === 'daily') {
      const hasScheduledDailyRates = [
        factory.weekdayWage,
        factory.saturdayWage,
        factory.sundayPoyaWage,
      ].some((rate) => typeof rate === 'number' && rate > 0);

      if (hasScheduledDailyRates) {
        normalWage = attendanceList.reduce((sum, att) => {
          const units = payableUnitsFor(att);
          if (units <= 0) return sum;
          const day = new Date(`${att.date}T12:00:00`).getDay();
          const isPoya = (factory.specialBillingDates || []).includes(att.date);
          const rate = (day === 0 || isPoya)
            ? (factory.sundayPoyaWage ?? factory.weekdayWage ?? employee.wageRate)
            : day === 6
              ? (factory.saturdayWage ?? factory.weekdayWage ?? employee.wageRate)
              : (factory.weekdayWage ?? employee.wageRate);
          return sum + Math.round(units * Number(rate || 0));
        }, 0);
      } else {
        normalWage = Math.round(payableDaysWorked * employee.wageRate);
      }
    } else if (employee.wageArrangement === 'weekly') {
      normalWage = Math.round((payableDaysWorked / 6) * employee.wageRate);
    } else if (employee.wageArrangement === 'monthly') {
      normalWage = Math.round((payableDaysWorked / 26) * employee.wageRate);
    }

    // Approved overtime only.
    const approvedOtHours = attendanceList.reduce((sum, att) => (
      att.submissionStatus === 'approved' ? sum + (att.totalOtHours || 0) : sum
    ), 0);
    if (approvedOtHours > 0 && !factory.overtimeEnabled) {
      throw new Error('Approved overtime exists, but overtime is disabled for ' + factory.name + '. Configure the factory OT rules before payroll.');
    }
    if (approvedOtHours > 0 && (!factory.employeeOvertimeRateHourly || factory.employeeOvertimeRateHourly <= 0)) {
      throw new Error('Employee OT pay rate is not configured for ' + factory.name + '. Payroll is blocked to prevent underpaying workers.');
    }
    const snapshotOtRateHourly = factory.employeeOvertimeRateHourly || 0;
    const otWage = Math.round(approvedOtHours * snapshotOtRateHourly);

    // Attendance bonuses are factory invoice charges only. They are deliberately excluded from worker salary.
    const grossEarnings = normalWage + otWage;

    // LKR 150 per hour by default; a factory may explicitly configure another rate.
    const lateHours = attendanceList.reduce((sum, att) => sum + Math.max(0, att.lateHours || 0), 0);
    const lateRate = Number(factory.lateDeductionPerHour ?? DEFAULT_LATE_DEDUCTION_RATE_PER_HOUR);
    const lateDeduction = Math.round(lateHours * lateRate);

    let breakfastCount = 0;
    let lunchCount = 0;
    let dinnerCount = 0;
    if (employee.eligibleForMeals) {
      attendanceList.forEach((att) => {
        if (att.hadBreakfast) breakfastCount++;
        if (att.hadLunch) lunchCount++;
        if (att.hadDinner) dinnerCount++;
      });
    }
    const breakfastCost = breakfastCount * (factory.breakfastRate || 0);
    const lunchCost = lunchCount * (factory.lunchRate || 0);
    const dinnerCost = dinnerCount * (factory.dinnerRate || 0);
    const totalMealDeductions = breakfastCost + lunchCost + dinnerCost;

    let boardingDays = 0;
    let boardingCost = 0;
    if (employee.eligibleForBoarding && boardingLocation) {
      attendanceList.forEach((att) => { if (att.hadBoarding) boardingDays++; });
      boardingCost = boardingDays * (boardingLocation.dailyRate || 0);
    }
    const totalBoardingDeductions = boardingCost;
    const advancesDeducted = advances.reduce((sum, adv) => sum + (adv.amount || 0), 0);
    const otherDeductions = 0;
    const totalDeductions = totalMealDeductions + lateDeduction + totalBoardingDeductions + advancesDeducted + otherDeductions;
    const netPayable = Math.max(0, grossEarnings - totalDeductions);

    return {
      id: `PAY-ITEM-${employee.id}-${Date.now()}`,
      payrollRunId,
      employeeId: employee.id,
      employeeName: employee.fullName,
      employeeGender: employee.gender,
      factoryId: factory.id,
      factoryName: factory.name,
      wageArrangement: employee.wageArrangement,
      snapshotWageRate: employee.wageRate,
      daysWorked: payableDaysWorked,
      normalWage,
      approvedOtHours,
      snapshotOtRateHourly,
      otWage,
      grossEarnings,
      breakfastCount,
      breakfastCost,
      lunchCount,
      lunchCost,
      dinnerCount,
      dinnerCost,
      totalMealDeductions,
      lateDeduction,
      lateHours,
      boardingDays,
      boardingCost,
      totalBoardingDeductions,
      advancesDeducted,
      otherDeductions,
      totalDeductions,
      netPayable,
      amountPaid: 0,
      remainingBalance: netPayable,
      paymentStatus: 'unpaid',
    };
  }
}
