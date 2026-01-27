import { body, validationResult } from "express-validator"
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import AppError from "../types/AppError"
import { clientHandler } from "../business/ClientHandler"
import { enrollmentService } from "../services/EnrollmentService"
import { EnrollmentStatus } from "../types/enums/EnrollmentStatus"
import { classService } from "../services/ClassService"

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
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Filter for active enrollments (status ACTIVE, no endDate passed, and class is still active)
    const activeEnrollments = []
    
    for (const enrollment of allEnrollments) {
      // Check enrollment status - must be ACTIVE
      if (enrollment.status !== EnrollmentStatus.ACTIVE) {
        continue
      }

      // Check if enrollment has an endDate that has passed (yesterday or earlier)
      if (enrollment.endDate) {
        const endDate = new Date(enrollment.endDate)
        endDate.setHours(0, 0, 0, 0)
        if (endDate <= yesterday) {
          // Enrollment has ended, skip
          continue
        }
      }
      
      // Check if class is still active (no endDate or endDate is in the future)
      try {
        const classInfo = await classService.getClass(enrollment.classId)
        if (classInfo.endDate) {
          const endDate = new Date(classInfo.endDate)
          endDate.setHours(0, 0, 0, 0)
          if (endDate <= today) {
            // Class is terminated, skip this enrollment
            continue
          }
        }
        // Class is active, include this enrollment
        activeEnrollments.push(enrollment)
      } catch (error) {
        // If we can't get the class, skip this enrollment
        continue
      }
    }
    
    res.send(activeEnrollments)
  })

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