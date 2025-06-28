import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import { query } from 'express-validator'
import { classService } from '../services/ClassService'
import { scheduleService } from '../services/ScheduleService'
import { ScheduleView } from '../types/enums/ScheduleView'
import AppError from '../types/AppError'
import { Class } from '../types/Class'

class ScheduleController {
  getClassSchedule = [
    query('view').isString().notEmpty().custom((value) => Object.values(ScheduleView).includes(value)),
    query('year').isNumeric(), 
    query('month').isNumeric(),
    query('date').isString(),
    query('location').isString(),
    asyncHandler(async (req: Request, res: Response) => {
      const { view, year, month, date, location } = req.query

      const classes = location ? await classService.getClassesAtLocation(location as string) : await classService.getAllClasses()

      if (!view) throw new AppError('errors.viewIsRequired', 400)

      let classesSchedule: Map<string, Class[]> = new Map()

      switch (view) {
        case ScheduleView.MONTH: 
          if (!year || !month) throw new AppError('errors.missingParameters', 400)

          classesSchedule = await scheduleService.getClassOccurrencesForMonth(classes, Number(year), Number(month))
          break
        case ScheduleView.WEEK:
          if (!date) throw new AppError('errors.missingParameters', 400)

          classesSchedule = await scheduleService.getClassOccurrencesForWeek(classes, new Date(date as string))
          break
        case ScheduleView.DAY: 
          if (!date) throw new AppError('errors.missingParameters', 400)

          classesSchedule = await scheduleService.getClassOccurrencesForDay(classes, new Date(date as string))
          break
      }

      res.send(Object.fromEntries(classesSchedule))
    })  
  ]
}

const scheduleController = new ScheduleController()
export { scheduleController, ScheduleController }

