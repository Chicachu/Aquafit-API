import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import { discountService } from '../services/DiscountService'
import { body, param, validationResult } from 'express-validator'
import AppError from '../types/AppError'
import { DiscountType } from '../types/enums/DiscountType'

class DiscountController {
  getAllDiscounts = asyncHandler(async (req: Request, res: Response) => {
    const discounts = await discountService.getAllDiscounts()

    res.send(discounts)
  })

  getDiscount = [
    param('discountId').isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }
      const discountId = req.params.discountId

      const discount = await discountService.getDiscount(discountId)
      
      res.send(discount)
    })
  ]

  createDiscount = [
    body('description').isString().notEmpty(),
    body('type').isString().notEmpty()
      .custom((value) => Object.values(DiscountType).includes(value)),
    body('amount').optional().isNumeric(),
    body('period').optional().isObject(),
    body('period.startDate').optional().isISO8601(),
    body('period.endDate').optional().isISO8601(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }

      const discount = await discountService.createDiscount(req.body)
      
      res.send(discount)
    })
  ]

  updateDiscount = [
    param('discountId').isString().notEmpty(),
    body('description').optional().isString().notEmpty(),
    body('type').optional().isString().notEmpty()
      .custom((value) => Object.values(DiscountType).includes(value)),
    body('amount').optional().isNumeric(),
    body('period').optional().isObject(),
    body('period.startDate').optional().isISO8601(),
    body('period.endDate').optional().custom((value) => {
      if (value === null || value === undefined) return true
      return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value) || value instanceof Date
    }),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }
      const discountId = req.params.discountId

      const discount = await discountService.updateDiscount(discountId, req.body)
      
      res.send(discount)
    })
  ]
}

const discountController = new DiscountController()
export { discountController, DiscountController }
