import { BillingFrequency } from "../types/enums/BillingFrequency"
import { Weekday } from "../types/enums/Weekday"

/**
 * Counts the number of occurrences of specific weekdays within a date range
 */
export function countWeekdaysInPeriod(startDate: Date, endDate: Date, weekdays: Weekday[]): number {
  let count = 0
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay()
    if (weekdays.includes(dayOfWeek)) {
      count++
    }
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return count
}

/**
 * Finds the next session day (based on weekdays) after a given date
 */
export function getNextSessionDay(date: Date, weekdays: Weekday[]): Date {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + 1)
  
  // Find the next day that matches one of the session weekdays
  let attempts = 0
  while (attempts < 7) {
    const dayOfWeek = nextDate.getDay()
    if (weekdays.includes(dayOfWeek)) {
      return nextDate
    }
    nextDate.setDate(nextDate.getDate() + 1)
    attempts++
  }
  
  // Fallback: return date + 1 day if no match found (shouldn't happen)
  return nextDate
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

  if (n <= 0) return new Date(startDate)
  let current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  for (let i = 0; i < n - 1; i++) {
    current = getNextSessionDay(current, weekdays)
    current.setHours(0, 0, 0, 0)
  }
  return current
}
