import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import { classService } from '../services/ClassService'
import { body, param, validationResult } from 'express-validator'
import i18n from '../../config/i18n'
import { ClassType } from '../types/enums/ClassType'
import { Weekday } from '../types/enums/Weekday'
import AppError from '../types/AppError'
import { Price } from '../types/Price'
import { ClassHandler, classHandler } from '../business/ClassHandler'

class ClassController {
  constructor(private classHandler: ClassHandler) {}

  addNewClass = [
    body('newClass').isObject().notEmpty()
      .withMessage(i18n.__('errors.missingParameters')),
    body('newClass.classLocation').isString().notEmpty()
      .withMessage(i18n.__('errors.missingParameters')),
    body('newClass.classType').isString().notEmpty()
      .custom((value) => Object.values(ClassType).includes(value))
      .withMessage(i18n.__('errors.missingParameters')),
    body('newClass.days').isArray().notEmpty()
      .custom((days: string[]) => days.every(day => 
        Object.values(Weekday).includes(parseInt(day))))
      .withMessage(i18n.__('errors.missingParameters')),
    body('newClass.startDate').isISO8601()
      .withMessage(i18n.__('errors.missingParameters')),
    body('newClass.startTime').isString()
      .withMessage(i18n.__('errors.missingParameters')),
    body('newClass.prices').isArray()
      .custom((prices: Price[]) => prices.every(price => 
        typeof price.amount === 'string' && 
        typeof price.currency === 'string' &&
        ['MXN', 'USD'].includes(price.currency)))
      .withMessage(i18n.__('errors.missingParameters')),
    body('newClass.maxCapacity').isString()
      .custom((value) => !isNaN(parseInt(value)))
      .withMessage(i18n.__('errors.missingParameters')),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(errors.array().join(', '), 400)
      }
      
      const { classLocation, classType, days, startDate, startTime, prices, maxCapacity } = req.body.newClass

      const classToAdd = {
        classLocation, 
        classType, 
        days, 
        startDate, 
        startTime, 
        prices, 
        maxCapacity
      }

      await classService.addNewClass(classToAdd)

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
    param('classId').isString().notEmpty()
      .withMessage(i18n.__('errors.missingParameters')),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(errors.array().join(', '), 400)
      }
      const classId = req.params.classId 

      const classDetails = await this.classHandler.getClassDetails(classId)
      
      res.send(classDetails)
    })
  ]
}

const classController = new ClassController(classHandler) 
export { classController, ClassController } 

