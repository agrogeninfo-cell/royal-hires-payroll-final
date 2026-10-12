import { Factory, BillingRateMethod } from '../types';

export interface RateResult {
  rate: number;
  method: BillingRateMethod;
  factoryId: string;
  factoryName: string;
}

export class BillingService {
  /**
   * Resolves the factory daily billing rate strictly based on Factory and Gender.
   * NO Job Category dimension exists. All workers are Helpers.
   */
  public static getApplicableDailyBillingRate(
    factory: Factory,
    gender: 'male' | 'female',
    attendanceDate?: string
  ): RateResult {
    if (!factory) {
      throw new Error('Factory record is required to calculate billing rate.');
    }

    if (!factory.active) {
      throw new Error(`Factory "${factory.name}" is marked as inactive.`);
    }

    // Check effective date range if provided
    if (attendanceDate) {
      if (factory.billingEffectiveFrom && attendanceDate < factory.billingEffectiveFrom) {
        throw new Error(
          `Billing rate for factory "${factory.name}" is not yet effective on ${attendanceDate} (Effective from: ${factory.billingEffectiveFrom}).`
        );
      }
      if (factory.billingEffectiveTo && attendanceDate > factory.billingEffectiveTo) {
        throw new Error(
          `Billing rate for factory "${factory.name}" expired on ${factory.billingEffectiveTo} (Attendance date: ${attendanceDate}).`
        );
      }
    }

    if (factory.billingMethod === 'SAME_RATE_FOR_ALL') {
      if (factory.sameRate === undefined || factory.sameRate === null || isNaN(factory.sameRate)) {
        throw new Error(
          `Validation Error: Factory "${factory.name}" uses SAME_RATE_FOR_ALL, but no standard daily rate is configured.`
        );
      }
      if (factory.sameRate < 0) {
        throw new Error(`Validation Error: Standard daily rate cannot be negative.`);
      }

      return {
        rate: factory.sameRate,
        method: 'SAME_RATE_FOR_ALL',
        factoryId: factory.id,
        factoryName: factory.name,
      };
    }

    if (factory.billingMethod === 'SEPARATE_MALE_FEMALE_RATES') {
      if (gender === 'male') {
        if (factory.maleRate === undefined || factory.maleRate === null || isNaN(factory.maleRate)) {
          throw new Error(
            `Validation Error: Factory "${factory.name}" uses SEPARATE_MALE_FEMALE_RATES, but male daily billing rate is missing.`
          );
        }
        if (factory.maleRate < 0) {
          throw new Error(`Validation Error: Male daily rate cannot be negative.`);
        }
        return {
          rate: factory.maleRate,
          method: 'SEPARATE_MALE_FEMALE_RATES',
          factoryId: factory.id,
          factoryName: factory.name,
        };
      } else if (gender === 'female') {
        if (factory.femaleRate === undefined || factory.femaleRate === null || isNaN(factory.femaleRate)) {
          throw new Error(
            `Validation Error: Factory "${factory.name}" uses SEPARATE_MALE_FEMALE_RATES, but female daily billing rate is missing.`
          );
        }
        if (factory.femaleRate < 0) {
          throw new Error(`Validation Error: Female daily rate cannot be negative.`);
        }
        return {
          rate: factory.femaleRate,
          method: 'SEPARATE_MALE_FEMALE_RATES',
          factoryId: factory.id,
          factoryName: factory.name,
        };
      } else {
        throw new Error(`Validation Error: Unknown gender "${gender}" for separate rate calculation.`);
      }
    }

    throw new Error(`Unknown billing rate method: "${factory.billingMethod}"`);
  }

  /**
   * Calculates billable charge for a single attendance day.
   */
  public static calculateDailyBillingCharge(
    factory: Factory,
    gender: 'male' | 'female',
    payableUnits: number,
    attendanceDate?: string
  ): { rate: number; method: BillingRateMethod; amount: number } {
    if (payableUnits <= 0) {
      const { rate, method } = this.getApplicableDailyBillingRate(factory, gender, attendanceDate);
      return { rate, method, amount: 0 };
    }

    const { rate, method } = this.getApplicableDailyBillingRate(factory, gender, attendanceDate);
    const amount = Math.round(rate * payableUnits);
    return { rate, method, amount };
  }

  /**
   * Calculates factory overtime billing charge.
   * Uses factory.factoryOvertimeRateHourly (NEVER employee wage or employee overtime pay rate).
   */
  public static calculateOvertimeBillingCharge(
    factory: Factory,
    approvedOtHours: number
  ): { otBillingRateHourly: number; amount: number } {
    if (!factory.overtimeEnabled || approvedOtHours <= 0) {
      return { otBillingRateHourly: factory.factoryOvertimeRateHourly || 0, amount: 0 };
    }

    const rate = factory.factoryOvertimeRateHourly;
    if (rate === undefined || rate === null || isNaN(rate) || rate < 0) {
      throw new Error(`Validation Error: Factory OT billing rate is missing or invalid for "${factory.name}".`);
    }

    const amount = Math.round(rate * approvedOtHours);
    return { otBillingRateHourly: rate, amount };
  }
}
