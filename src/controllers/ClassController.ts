import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import { classService } from '../services/ClassService'
import { body, param, validationResult } from 'express-validator'
import { ClassType } from '../types/enums/ClassType'
import { Weekday } from '../types/enums/Weekday'
import AppError from '../types/AppError'
import { Price } from '../types/Price'
import { classHandler } from '../business/ClassHandler'

class ClassController {
  addNewClass = [
    body('newClass').isObject().notEmpty(),
    body('newClass.classLocation').isString().notEmpty(),
    body('newClass.classType').isString().notEmpty()
      .custom((value) => Object.values(ClassType).includes(value)),
    body('newClass.days').isArray().notEmpty()
      .custom((days: string[]) => days.every(day => 
        Object.values(Weekday).includes(parseInt(day)))),
    body('newClass.startDate').isISO8601(),
    body('newClass.startTime').isString(),
    body('newClass.prices').isArray()
      .custom((prices: Price[]) => prices.every(price => 
        typeof price.amount === 'string' && 
        typeof price.currency === 'string' &&
        ['MXN'].includes(price.currency))),
    body('newClass.billingFrequency').isString().notEmpty(),
    body('newClass.maxCapacity').isString()
      .custom((value) => !isNaN(parseInt(value))),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }
      
      await classService.addNewClass(req.body.newClass)
      res.send()
    })
  ]

  getAllLocations = asyncHandler(async (req: Request, res: Response) => {
    const locations = await classService.getAllLocations()

    res.send(locations)
  })

  getAllClasses = asyncHandler(async (req: Request, res: Response) => {
    const classes = await classService.getAllClasses()

    res.send(classes)
  })
  
  getClassDetails = [ 
    param('classId').isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }
      const classId = req.params.classId 

      const classDetails = await classHandler.getClassDetails(classId)
      
      res.send(classDetails)
    })
  ]

  getClassTypeLocationTimeMap = asyncHandler(async (req: Request, res: Response) => {
    const classScheduleMap = await classService.getClassScheduleMap()

    res.send(classScheduleMap)
  })
}

const classController = new ClassController() 
export { classController, ClassController } 

