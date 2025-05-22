import { body, validationResult } from "express-validator"
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import AppError from "../types/AppError"
import { clientHandler } from "../business/ClientHandler"

class EnrollmentController {
  enrollClient = [
    body('classId').isString().notEmpty(),
    body('clientId').isString().notEmpty(),
    body('startDate').isString().notEmpty(), 
    body('billingFrequency').isString().notEmpty(),
    //body('currency').isString().notEmpty(), // maybe have a client preference currency on each user. 
      asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new AppError(i18n.__('errors.missingParameters'), 400)
        }

        const { classId, clientId, startDate, billingFrequency } = req.body

        await clientHandler.enrollClient(classId, clientId, startDate, billingFrequency)

        res.send()
      })
  ]
}

// userId: string
//   classId: string
//   startDate: Date
//   billingFrequency: BillingFrequency

const enrollmentCotroller = new EnrollmentController()
export { enrollmentCotroller, EnrollmentController }