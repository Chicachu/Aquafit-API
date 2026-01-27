import { body, param, validationResult } from "express-validator"
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import AppError from "../types/AppError"
import { assignmentService } from "../services/AssignmentService"
import { Currency } from "../types/enums/Currency"

class AssignmentController {
  assignInstructor = [
    body('classId').isString().notEmpty(),
    body('instructorId').isString().notEmpty(),
    body('startDate').isString().notEmpty(),
    body('endDate').optional(),
    body('paymentPerSession').optional(),
    body('paymentPerSession.amount').optional().isNumeric(),
    body('paymentPerSession.currency').optional().isString().isIn(['MXN', 'USD']),
      asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new AppError('errors.missingParameters', 400)
        }

        const { classId, instructorId, startDate, endDate, paymentPerSession } = req.body
        const createDto: Parameters<typeof assignmentService.assignInstructor>[0] = {
          classId,
          instructorId,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null
        }
        if (paymentPerSession?.amount != null && paymentPerSession?.currency) {
          createDto.paymentPerSession = { amount: Number(paymentPerSession.amount), currency: paymentPerSession.currency }
        }

        const assignment = await assignmentService.assignInstructor(createDto)

        res.send(assignment)
      })
  ]

  updateAssignment = [
    param('assignmentId').isString().notEmpty(),
    body('startDate').optional().isString(),
    body('endDate').optional(),
    body('paymentPerSession').optional(),
    body('paymentPerSession.amount').optional().isNumeric(),
    body('paymentPerSession.currency').optional().isString().isIn(['MXN', 'USD']),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }
      const { assignmentId } = req.params
      const opts: { startDate?: Date; endDate?: Date | null; paymentPerSession?: { amount: number; currency: Currency } | null } = {}
      if (req.body.startDate != null) opts.startDate = new Date(req.body.startDate)
      if (req.body.endDate !== undefined) opts.endDate = req.body.endDate ? new Date(req.body.endDate) : null
      if (req.body.paymentPerSession !== undefined) {
        const p = req.body.paymentPerSession
        opts.paymentPerSession = p?.amount != null && p?.currency ? { amount: Number(p.amount), currency: p.currency as Currency } : null
      }
      const assignment = await assignmentService.updateAssignment(assignmentId, opts)
      res.send(assignment)
    })
  ]

  unassignInstructor = [
    param('assignmentId').isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }

      const { assignmentId } = req.params
      await assignmentService.deleteAssignment(assignmentId)
      res.send()
    })
  ]
}

const assignmentController = new AssignmentController()
export { assignmentController, AssignmentController }
