import moment from "moment-timezone";
import { CalendarClass } from "../types/CalendarClass";
import { Class } from "../types/Class";

class ScheduleService {
  async getClassOccurrencesForMonth(classes: Class[], year: number, month: number): Promise<Map<string, CalendarClass[]>> {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const occurrences = await this._getClassOccurencesForRange(classes, startDate, endDate);

    return this._groupOccurrencesByDate(occurrences)
  }

  async getClassOccurrencesForWeek(classes: Class[], date: Date): Promise<Map<string, CalendarClass[]>> {
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - date.getDay());
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); 
    
    const occurrences = await this._getClassOccurencesForRange(classes, startDate, endDate);

    return this._groupOccurrencesByDate(occurrences)
  }

  async getClassOccurrencesForDay(classes: Class[], date: Date): Promise<Map<string, CalendarClass[]>> {
    const startDate = new Date(date.setHours(0, 0, 0, 0));
    const endDate = new Date(date.setHours(23, 59, 59, 999));

    const occurrences = await this._getClassOccurencesForRange(classes, startDate, endDate);

    return this._groupOccurrencesByDate(occurrences)
  }

  private async _getClassOccurencesForRange(classes: Class[], rangeStart: Date, rangeEnd: Date): Promise<CalendarClass[]> {
    const occurrences: CalendarClass[] = []

    const periodStart = new Date(rangeStart.setHours(0, 0, 0, 0))
    const periodEnd = new Date(rangeEnd.setHours(23, 59, 59, 999))

    classes.forEach(classInfo => {
      const classStartDate = new Date(classInfo.startDate)
      const classEndDate = classInfo.endDate ? new Date(classInfo.endDate) : null

      if ((classEndDate && classEndDate < periodStart) || classStartDate > periodEnd ) return 

      const effectiveStartDate = classStartDate > periodStart ? classStartDate : periodStart

      const effectiveEndDate = classEndDate && classEndDate < periodEnd ? classEndDate : periodEnd

      let currentDate = new Date(effectiveStartDate)
      while (currentDate <= effectiveEndDate) {
        if (classInfo.days.includes(currentDate.getDay())) {
          occurrences.push({
            ...classInfo,
            date: this._addTimeToDate(currentDate, classInfo.startTime)
          })
        }

        currentDate.setDate(currentDate.getDate() + 1)
      }
    })

    return occurrences.sort((a, b) => {
      const dateCompare = a.date.getTime() - b.date.getTime();
      if (dateCompare === 0) {
        return a.startTime.localeCompare(b.startTime)
      }
      return dateCompare
    })
  } 

  private _groupOccurrencesByDate(occurrences: CalendarClass[]): Map<string, CalendarClass[]> {
    return new Map(
      Object.entries(
        occurrences.reduce((acc, curr) => {
          const dateKey = curr.date.toISOString().split('T')[0];
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }
          acc[dateKey].push(curr);
          return acc;
        }, {} as { [key: string]: CalendarClass[] })
      )
    );
  } 

  private _addTimeToDate(date: Date, timeString: string): Date {
    const [hours, minutes] = timeString.split(":").map(Number)
    const newDate = new Date(date)
    newDate.setHours(hours, minutes)
    return newDate
  }
}

const scheduleService = new ScheduleService()
export { scheduleService, ScheduleService }