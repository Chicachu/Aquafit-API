import path from "path";
import { CalendarClass } from "../types/CalendarClass";
import { Class } from "../types/Class";
import { logger } from "./LoggingService";
import { usersService } from "./UsersService";
import { assignmentService } from "./AssignmentService";
import { classService } from "./ClassService";
import AppError from "../types/AppError";
import { Role } from "../types/enums/Role";
import { InstructorClassDetails } from "../types/InstructorClassDetails";

class ScheduleService {
  private readonly _FILE_NAME = path.basename(__filename)
  
  async getClassOccurrencesForMonth(classes: Class[], year: number, month: number): Promise<Map<string, CalendarClass[]>> {
    logger.debugInside(this._FILE_NAME, this.getClassOccurrencesForMonth.name)
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const occurrences = await this._getClassOccurencesForRange(classes, startDate, endDate);

    logger.debugComplete(this._FILE_NAME, this.getClassOccurrencesForMonth.name)
    return this._groupOccurrencesByDate(occurrences)
  }

  async getClassOccurrencesForWeek(classes: Class[], date: Date): Promise<Map<string, CalendarClass[]>> {
    logger.debugInside(this._FILE_NAME, this.getClassOccurrencesForWeek.name)
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - date.getDay());
    
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); 
    
    const occurrences = await this._getClassOccurencesForRange(classes, startDate, endDate);

    logger.debugComplete(this._FILE_NAME, this.getClassOccurrencesForWeek.name)
    return this._groupOccurrencesByDate(occurrences)
  }

  async getClassOccurrencesForDay(classes: Class[], date: Date): Promise<Map<string, CalendarClass[]>> {
    logger.debugInside(this._FILE_NAME, this.getClassOccurrencesForDay.name)
    const startDate = new Date(date.setHours(0, 0, 0, 0));
    const endDate = new Date(date.setHours(23, 59, 59, 999));

    const occurrences = await this._getClassOccurencesForRange(classes, startDate, endDate)

    logger.debugComplete(this._FILE_NAME, this.getClassOccurrencesForDay.name)
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

  async getInstructorClassDetails(userId: string): Promise<InstructorClassDetails> {
    logger.debugInside(this._FILE_NAME, this.getInstructorClassDetails.name, { userId })

    const instructor = await usersService.getUserById(userId)

    if (!instructor || instructor.role !== Role.INSTRUCTOR) {
      throw new AppError('errors.resourceNotFound', 404)
    }

    const assignments = await assignmentService.getInstructorAssignments(userId)
    const assignmentInfo: InstructorClassDetails['assignmentInfo'] = []

    for (const assignment of assignments) {
      const classInfo = await classService.getClass(assignment.classId)
      if (!classInfo) {
        logger.info(
          this._FILE_NAME,
          this.getInstructorClassDetails.name,
          `Skipping assignment ${assignment._id}: class ${assignment.classId} not found`,
          { assignmentId: assignment._id, classId: assignment.classId }
        )
        continue
      }
      assignmentInfo.push({ class: classInfo, assignment })
    }

    logger.debugComplete(this._FILE_NAME, this.getInstructorClassDetails.name)
    return {
      instructor,
      assignmentInfo
    }
  }
}

const scheduleService = new ScheduleService()
export { scheduleService, ScheduleService }