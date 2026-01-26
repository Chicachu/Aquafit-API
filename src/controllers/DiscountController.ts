import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import { discountService } from '../services/DiscountService'
import { param, validationResult } from 'express-validator'
import AppError from '../types/AppError'

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
}

const discountController = new DiscountController()
export { discountController, DiscountController }
