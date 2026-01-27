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
