import { body, param, validationResult } from "express-validator"
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import AppError from "../types/AppError"
import { clientHandler } from "../business/ClientHandler"
import { enrollmentService } from "../services/EnrollmentService"
import { EnrollmentStatus } from "../types/enums/EnrollmentStatus"

class EnrollmentController {
  enrollClient = [
    body('classId').isString().notEmpty(),
    body('clientId').isString().notEmpty(),
    body('startDate').isString().notEmpty(), 
    body('billingFrequencyOverride').isString().optional(),
    body('daysOverride').optional(),
    //body('currency').isString().notEmpty(), // maybe have a client preference currency on each user. 
      asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new AppError('errors.missingParameters', 400)
        }

        const { classId, clientId, startDate, billingFrequency, daysOverride } = req.body

        await clientHandler.enrollClient(classId, clientId, startDate, billingFrequency, daysOverride)

        res.send()
      })
  ]

  getAllActiveEnrollments = asyncHandler(async (req: Request, res: Response) => {
    const allEnrollments = await enrollmentService.getAllEnrollments()
    const activeEnrollments = allEnrollments.filter(
      (e) => e.status === EnrollmentStatus.ACTIVE
    )
    res.send(activeEnrollments)
  })

  getClientEnrollmentDetails = [
    param('userId').isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }

      const { userId } = req.params
      const clientEnrollmentDetails = await clientHandler.getClientEnrollmentDetails(userId)
      res.send(clientEnrollmentDetails)
    })
  ]

  unenrollClient = [
    body('enrollmentId').isString().notEmpty(),
    body('cancelReason').isString().optional(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }

      const { enrollmentId, cancelReason } = req.body
      const updatedEnrollment = await enrollmentService.unenrollClient(enrollmentId, cancelReason)
      res.send(updatedEnrollment)
    })
  ]
}

const enrollmentCotroller = new EnrollmentController()
export { enrollmentCotroller, EnrollmentController }