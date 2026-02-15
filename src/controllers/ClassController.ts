import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import { classService } from '../services/ClassService'
import { body, param, validationResult } from 'express-validator'
import { ClassType } from '../types/enums/ClassType'
import { Weekday } from '../types/enums/Weekday'
import AppError from '../types/AppError'
import { Price } from '../types/Price'
import { classHandler } from '../business/ClassHandler'
import { ClassUpdateOptions } from '../types/Class'

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
  
  getClass = [
    param('classId').isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }
      const classId = req.params.classId
      const foundClass = await classService.getClass(classId)
      if (!foundClass) {
        throw new AppError('errors.resourceNotFound', 404)
      }
      res.send(foundClass)
    })
  ]

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

  updateClass = [
    param('classId').isString().notEmpty(),
    body('newClass').optional().isObject(),
    body('newClass.classLocation').optional().isString().notEmpty(),
    body('newClass.classType').optional().isString().notEmpty()
      .custom((value) => Object.values(ClassType).includes(value)),
    body('newClass.days').optional().isArray().notEmpty()
      .custom((days: string[]) => days.every(day => 
        Object.values(Weekday).includes(parseInt(day)))),
    body('newClass.startDate').optional().isISO8601(),
    body('newClass.startTime').optional().isString(),
    body('newClass.prices').optional().isArray()
      .custom((prices: Price[]) => prices.every(price => 
        typeof price.amount === 'string' && 
        typeof price.currency === 'string' &&
        ['MXN'].includes(price.currency))),
    body('newClass.billingFrequency').optional().isString().notEmpty(),
    body('newClass.maxCapacity').optional().isString()
      .custom((value) => !isNaN(parseInt(value))),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }
      
      const classId = req.params.classId
      const currentClass = await classService.getClass(classId)

      if (!currentClass) {
        throw new AppError('errors.resourceNotFound', 404)
      }

      const updateOptions: ClassUpdateOptions = {}
      if (req.body.newClass?.classLocation) updateOptions.classLocation = req.body.newClass.classLocation
      if (req.body.newClass?.startTime) updateOptions.startTime = req.body.newClass.startTime
      if (req.body.newClass?.days) updateOptions.days = req.body.newClass.days.map((day: string) => parseInt(day))
      if (req.body.newClass?.prices) updateOptions.prices = req.body.newClass.prices
      if (req.body.newClass?.maxCapacity) updateOptions.maxCapacity = parseInt(req.body.newClass.maxCapacity)

      await classService.updateClassInfo(currentClass, updateOptions)
      res.send()
    })
  ]

  terminateClass = [
    param('classId').isString().notEmpty(),
    body('endDate').isISO8601().toDate().custom((value) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const endDate = new Date(value)
      endDate.setHours(0, 0, 0, 0)
      if (endDate < today) {
        throw new Error('endDate cannot be before today')
      }
      return true
    }),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }
      
      const classId = req.params.classId
      const endDate = req.body.endDate as Date
      await classHandler.terminateClass(classId, endDate)
      res.send()
    })
  ]

  cancelClass = [
    param('classId').isString().notEmpty(),
    body('cancellationDate').isISO8601().toDate(),
    body('cancelledBy').optional().isIn(['instructor', 'client']),
    body('reason').optional().isString(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }
      
      const classId = req.params.classId
      const cancellationDate = req.body.cancellationDate as Date
      const cancelledBy = req.body.cancelledBy as 'instructor' | 'client' | undefined
      const reason = req.body.reason as string | undefined
      await classHandler.cancelClass(classId, cancellationDate, cancelledBy, reason)
      res.send()
    })
  ]

  addNote = [
    param('classId').isString().notEmpty(),
    body('content').isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }

      const classId = req.params.classId
      const { content } = req.body

      const updatedClass = await classService.addNoteToClass(classId, content)
      res.send(updatedClass)
    })
  ]

  deleteNote = [
    param('classId').isString().notEmpty(),
    param('noteId').isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }

      const { classId, noteId } = req.params

      const updatedClass = await classService.deleteNoteFromClass(classId, noteId)
      res.send(updatedClass)
    })
  ]
}

const classController = new ClassController() 
export { classController, ClassController } 

