import moment from 'moment-timezone';

/** Aquafit operates in Puerto Vallarta. */
export const BUSINESS_TIME_ZONE = 'America/Mazatlan';

export function formatBusinessDateKey(date: Date): string {
  return moment(date).tz(BUSINESS_TIME_ZONE).format('YYYY-MM-DD');
}

export function getBusinessDayOfWeek(date: Date): number {
  return moment(date).tz(BUSINESS_TIME_ZONE).day();
}

/**
 * Interprets a stored Date as a business-calendar day (America/Mazatlan).
 * Date-only values at UTC midnight (e.g. from "YYYY-MM-DD" or setHours on a UTC server)
 * are treated as that calendar date in the business timezone, not as an instant shifted back a day.
 */
export function parseAsBusinessCalendarDate(date: Date): Date {
  const utc = moment.utc(date);
  if (
    utc.hour() === 0
    && utc.minute() === 0
    && utc.second() === 0
    && utc.millisecond() === 0
  ) {
    return moment
      .tz(utc.format('YYYY-MM-DD'), 'YYYY-MM-DD', BUSINESS_TIME_ZONE)
      .startOf('day')
      .toDate();
  }

  return moment(date).tz(BUSINESS_TIME_ZONE).startOf('day').toDate();
}

export function getBusinessCalendarDayOfWeek(date: Date): number {
  return moment(parseAsBusinessCalendarDate(date)).tz(BUSINESS_TIME_ZONE).day();
}

export function isWithinBusinessDateRange(date: Date, start: Date, end: Date): boolean {
  const d = moment(date).tz(BUSINESS_TIME_ZONE).startOf('day');
  const rangeStart = moment(start).tz(BUSINESS_TIME_ZONE).startOf('day');
  const rangeEnd = moment(end).tz(BUSINESS_TIME_ZONE).startOf('day');
  return d.isSameOrAfter(rangeStart, 'day') && d.isSameOrBefore(rangeEnd, 'day');
}

/** MongoDB range matching a single business calendar day in America/Mazatlan. */
export function businessDateDayQuery(date: Date): { $gte: Date; $lt: Date } {
  const start = moment(date).tz(BUSINESS_TIME_ZONE).startOf('day');
  return {
    $gte: start.toDate(),
    $lt: start.clone().add(1, 'day').toDate()
  };
}

export function isBusinessDateAfter(a: Date, b: Date): boolean {
  return formatBusinessDateKey(a) > formatBusinessDateKey(b);
}

export function combineBusinessDateAndTime(date: Date, timeString: string): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  return moment(date)
    .tz(BUSINESS_TIME_ZONE)
    .startOf('day')
    .hours(hours)
    .minutes(minutes ?? 0)
    .seconds(0)
    .milliseconds(0)
    .toDate();
}
