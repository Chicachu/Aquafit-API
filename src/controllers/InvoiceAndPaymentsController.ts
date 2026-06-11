import { body, param, validationResult } from 'express-validator'
import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import AppError from '../types/AppError'
import { PaymentType } from '../types/enums/PaymentType'
import { invoiceAndPaymentsService } from '../services/InvoiceAndPaymentsService'

class InvoiceAndPaymentsController {
  getInvoicesByUserId = [
    param('userId').isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }

      const { userId } = req.params
      const result = await invoiceAndPaymentsService.getInvoicesByUserId(userId)
      res.send(result)
    })
  ]

  getInvoiceHistory = [
    param('userId').isString().notEmpty(),
    param('enrollmentId').isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }

      const { userId, enrollmentId } = req.params
      const invoiceHistory = await invoiceAndPaymentsService.getInvoiceHistory(userId, enrollmentId)
      res.send(invoiceHistory)
    })
  ]

  getInvoiceDetails = [
    param('invoiceId').isString().notEmpty(),
    param('userId').isString().notEmpty(),
    param('enrollmentId').isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }

      const { invoiceId, userId, enrollmentId } = req.params
      const invoiceDetails = await invoiceAndPaymentsService.getInvoiceDetails(
        invoiceId,
        userId,
        enrollmentId
      )

      res.send(invoiceDetails)
    })
  ]

  applyPaymentToInvoice = [
    param('invoiceId').isString().notEmpty(),
    param('userId').isString().notEmpty(),
    param('enrollmentId').isString().notEmpty(),
    body('amount').isFloat({ gt: 0 }),
    body('paymentType').isString().isIn(Object.values(PaymentType)),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }

      const { invoiceId, userId, enrollmentId } = req.params
      const { amount, paymentType } = req.body

      const invoiceDetails = await invoiceAndPaymentsService.applyPaymentToInvoice(
        invoiceId,
        userId,
        enrollmentId,
        Number(amount),
        paymentType as PaymentType
      )

      res.send(invoiceDetails)
    })
  ]

  getPayableDetails = [
    param('userId').isString().notEmpty(),
    param('payableId').isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }

      const { userId, payableId } = req.params
      const payable = await invoiceAndPaymentsService.getPayableDetails(userId, payableId)
      if (!payable) {
        throw new AppError('errors.resourceNotFound', 404)
      }

      res.send(payable)
    })
  ]
}

const invoiceAndPaymentsController = new InvoiceAndPaymentsController()
export { invoiceAndPaymentsController, InvoiceAndPaymentsController }
