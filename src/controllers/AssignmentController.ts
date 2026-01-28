import { body, param, validationResult } from "express-validator"
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import AppError from "../types/AppError"
import { assignmentService } from "../services/AssignmentService"
import { Currency } from "../types/enums/Currency"

class AssignmentController {
  getClassIdsWithActiveAssignment = asyncHandler(async (req: Request, res: Response) => {
    const classIds = await assignmentService.getClassIdsWithActiveAssignment()
    res.send({ classIds })
  })

  assignInstructor = [
    body('classId').isString().notEmpty(),
    body('employeeId').isString().notEmpty(),
    body('startDate').isString().notEmpty(),
    body('endDate').optional(),
    body('paymentValue').optional(),
    body('paymentValue.amount').optional().isNumeric(),
    body('paymentValue.currency').optional().isString().isIn(['MXN', 'USD']),
      asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new AppError('errors.missingParameters', 400)
        }

        const { classId, employeeId, startDate, endDate, paymentValue } = req.body
        const createDto: Parameters<typeof assignmentService.assignInstructor>[0] = {
          classId,
          employeeId,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null
        }
        if (paymentValue?.amount != null && paymentValue?.currency) {
          createDto.paymentValue = { amount: Number(paymentValue.amount), currency: paymentValue.currency }
        }

        const assignment = await assignmentService.assignInstructor(createDto)

        res.send(assignment)
      })
  ]

  updateAssignment = [
    param('assignmentId').isString().notEmpty(),
    body('startDate').optional().isString(),
    body('endDate').optional(),
    body('paymentValue').optional(),
    body('paymentValue.amount').optional().isNumeric(),
    body('paymentValue.currency').optional().isString().isIn(['MXN', 'USD']),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }
      const { assignmentId } = req.params
      const opts: { startDate?: Date; endDate?: Date | null; paymentValue?: { amount: number; currency: Currency } | null } = {}
      if (req.body.startDate != null) opts.startDate = new Date(req.body.startDate)
      if (req.body.endDate !== undefined) opts.endDate = req.body.endDate ? new Date(req.body.endDate) : null
      const p = req.body?.paymentValue
      if (p != null && typeof p === 'object') {
        opts.paymentValue = p?.amount != null && p?.currency ? { amount: Number(p.amount), currency: p.currency as Currency } : null
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
