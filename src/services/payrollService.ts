const LATE_DEDUCTION_RATE_PER_HOUR = 150;

import {
  Employee,
  Factory,
  AttendanceRecord,
  BoardingLocation,
  EmployeePayment,
  PayrollItem,
} from '../types';

export class PayrollService {
  /**
   * Calculates a single employee's payroll line item for a given period.
   * Ensures wage rates are completely separate from factory billing rates.
   * Deducts meals and boarding only for eligible employees with recorded usage.
   */
  public static calculateEmployeePayrollItem(
    employee: Employee,
    factory: Factory,
    attendanceList: AttendanceRecord[],
    boardingLocation: BoardingLocation | null,
    advances: EmployeePayment[],
    payrollRunId: string
  ): PayrollItem {
    // 1. Calculate normal wages based on wage arrangement
    const payableDaysWorked = attendanceList.reduce((sum, att) => {
      if (att.status === 'present') return sum + att.payableUnits;
      if (att.status === 'half_day') return sum + 0.5;
      return sum;
    }, 0);

    let normalWage = 0;
    if (employee.wageArrangement === 'daily') {
      normalWage = Math.round(payableDaysWorked * employee.wageRate);
    } else if (employee.wageArrangement === 'weekly') {
      // Sri Lankan factory standard standard 6 working days per week arrangement
      normalWage = Math.round((payableDaysWorked / 6) * employee.wageRate);
    } else if (employee.wageArrangement === 'monthly') {
      // Configurable standard 26 payable days divisor
      normalWage = Math.round((payableDaysWorked / 26) * employee.wageRate);
    }

    // 2. Overtime calculation (approved overtime only!)
    // Uses factory.employeeOvertimeRateHourly, NOT billing rate
    const approvedOtHours = attendanceList.reduce((sum, att) => {
      // Must be approved by Admin
      if (att.submissionStatus === 'approved') {
        return sum + (att.totalOtHours || 0);
      }
      return sum;
    }, 0);

    const snapshotOtRateHourly = factory.employeeOvertimeRateHourly || 0;
    const otWage = Math.round(approvedOtHours * snapshotOtRateHourly);

    const grossEarnings = normalWage + otWage;

    // 3. Late deductions: Rs. 150 per recorded late hour, rounded to whole rupees.
    const lateHours = attendanceList.reduce((sum, att) => sum + Math.max(0, att.lateHours || 0), 0);
    const lateDeduction = Math.round(lateHours * LATE_DEDUCTION_RATE_PER_HOUR);

    // 4. Meal Deductions
    // Applied ONLY if eligible for meals AND meal was actually recorded
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

    // 5. Boarding Deductions
    // Applied ONLY if eligible for boarding AND boarding utilized
    let boardingDays = 0;
    let boardingCost = 0;
    if (employee.eligibleForBoarding && boardingLocation) {
      attendanceList.forEach((att) => {
        if (att.hadBoarding) boardingDays++;
      });
      boardingCost = boardingDays * (boardingLocation.dailyRate || 0);
    }
    const totalBoardingDeductions = boardingCost;

    // 6. Salary Advances deduction
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
