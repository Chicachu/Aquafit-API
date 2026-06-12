import moment from 'moment-timezone';

/** Aquafit operates in Puerto Vallarta. */
export const BUSINESS_TIME_ZONE = 'America/Mazatlan';

export function formatBusinessDateKey(date: Date): string {
  return moment(date).tz(BUSINESS_TIME_ZONE).format('YYYY-MM-DD');
}

export function getBusinessDayOfWeek(date: Date): number {
  return moment(date).tz(BUSINESS_TIME_ZONE).day();
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
