import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import { param } from 'express-validator'
import i18n from '../../config/i18n';
import { classService } from '../services/ClassService'
import { scheduleService } from '../services/ScheduleService'
import { ScheduleView } from '../types/enums/ScheduleView'
import AppError from '../types/AppError'
import { Class } from '../types/Class'

class ScheduleController {
  getClassSchedule = [
    param('view').isString().notEmpty().custom((value) => Object.values(ScheduleView).includes(value)).withMessage(i18n.__('errors.viewIsRequired')),
    param('year').isNumeric(), 
    param('month').isNumeric(),
    param('date').isString(),
    asyncHandler(async (req: Request, res: Response) => {
      const { view, year, month, date } = req.params

      const classes = await classService.getAllClasses()

      if (!view) throw new AppError(i18n.__('errors.viewIsRequired'), 400)

      let classesSchedule: Map<string, Class[]>

      switch (view) {
        case ScheduleView.MONTH: 
          if (!year || !month) throw new AppError(i18n.__('errors.missingParameters'), 400)

          classesSchedule = await scheduleService.getClassOccurrencesForMonth(classes, Number(year), Number(month))
          break
        case ScheduleView.WEEK:
          if (!date) throw new AppError(i18n.__('errors.missingParameters'), 400)

          classesSchedule = await scheduleService.getClassOccurrencesForWeek(classes, new Date(date))
          break
        case ScheduleView.DAY: 
          if (!date) throw new AppError(i18n.__('errors.missingParameters'), 400)

          classesSchedule = await scheduleService.getClassOccurrencesForDay(classes, new Date(date))
          break
      }
    })  
  ]
}

const scheduleController = new ScheduleController()
export { scheduleController, ScheduleController }

