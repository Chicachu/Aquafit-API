import moment from 'moment-timezone'
import { BillingFrequency } from "../types/enums/BillingFrequency"
import { Weekday } from "../types/enums/Weekday"
import { BUSINESS_TIME_ZONE } from './scheduleDateUtils'

function toBusinessMoment(date: Date): moment.Moment {
  return moment(date).tz(BUSINESS_TIME_ZONE).startOf('day')
}

/** Normalize a date to midnight in the business timezone (America/Mazatlan). */
export function toBusinessStartOfDay(date: Date): Date {
  return toBusinessMoment(date).toDate()
}

export function addBusinessDays(date: Date, days: number): Date {
  return toBusinessMoment(date).add(days, 'days').toDate()
}

/**
 * Counts the number of occurrences of specific weekdays within a date range
 */
export function countWeekdaysInPeriod(startDate: Date, endDate: Date, weekdays: Weekday[]): number {
  let count = 0
  const currentDate = toBusinessMoment(startDate)
  const end = toBusinessMoment(endDate)

  while (currentDate.isSameOrBefore(end, 'day')) {
    if (weekdays.includes(currentDate.day())) {
      count++
    }
    currentDate.add(1, 'day')
  }

  return count
}

/**
 * Finds the next session day (based on weekdays) after a given date
 */
export function getNextSessionDay(date: Date, weekdays: Weekday[]): Date {
  const nextDate = toBusinessMoment(date).add(1, 'day')

  let attempts = 0
  while (attempts < 7) {
    if (weekdays.includes(nextDate.day())) {
      return nextDate.toDate()
    }
    nextDate.add(1, 'day')
    attempts++
  }

  return nextDate.toDate()
}

/**
 * Returns the period-end session day from startDate based on billing frequency.
 * Session count per period:
 * - MONTHLY: 4 × days per week (e.g. 8 for Sat/Sun)
 * - WEEKLY: 1 × days per week (e.g. 3 for Mon/Wed/Fri)
 * - ONE_TIME: 1 (first session is the last session)
 */
export function getNthSessionDay(
  startDate: Date,
  billingFrequency: BillingFrequency,
  weekdays: number[]
): Date {
  let n: number
  switch (billingFrequency) {
    case BillingFrequency.MONTHLY:
      n = 4 * weekdays.length
      break
    case BillingFrequency.WEEKLY:
      n = 1 * weekdays.length
      break
    case BillingFrequency.ONE_TIME:
    default:
      n = 1
      break
  }

  if (n <= 0) return toBusinessStartOfDay(startDate)
  let current = toBusinessStartOfDay(startDate)
  for (let i = 0; i < n - 1; i++) {
    current = getNextSessionDay(current, weekdays)
  }
  return current
}
