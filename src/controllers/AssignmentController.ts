import { body, param, validationResult } from "express-validator"
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import AppError from "../types/AppError"
import { assignmentService } from "../services/AssignmentService"

class AssignmentController {
  assignInstructor = [
    body('classId').isString().notEmpty(),
    body('instructorId').isString().notEmpty(),
    body('startDate').isString().notEmpty(),
    body('endDate').optional(),
      asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new AppError('errors.missingParameters', 400)
        }

        const { classId, instructorId, startDate, endDate } = req.body

        const assignment = await assignmentService.assignInstructor({
          classId,
          instructorId,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null
        })

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
