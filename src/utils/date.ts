/**
 * Format business dates using the device's local calendar, not UTC.
 * Date-only form values (YYYY-MM-DD) must not shift to the previous day
 * when a local-midnight Date is converted with toISOString().
 */
export const formatLocalDate = (date: Date = new Date()): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const todayLocalDate = (): string => formatLocalDate(new Date());
