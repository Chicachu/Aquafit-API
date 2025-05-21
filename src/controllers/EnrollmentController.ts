import { body, validationResult } from "express-validator"
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import AppError from "../types/AppError"
import { clientHandler } from "../business/ClientHandler"

class EnrollmentController {
  enrollClient = [
    body('classId').isString().notEmpty(),
    body('userId').isString().notEmpty(),
    body('startDate').isDate().notEmpty(), 
    body('billingFrequency').isString().notEmpty(),
    //body('currency').isString().notEmpty(), // maybe have a client preference currency on each user. 
      asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new AppError(errors.array().join(', '), 400)
        }

        const { classId, userId, startDate, billingFrequency } = req.body

        await clientHandler.enrollClient(classId, userId, startDate, billingFrequency)
      })
  ]
}

// userId: string
//   classId: string
//   startDate: Date
//   billingFrequency: BillingFrequency

const enrollmentCotroller = new EnrollmentController()
export { enrollmentCotroller, EnrollmentController }