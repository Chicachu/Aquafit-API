import path from "path"
import { invoiceCollection, InvoiceCollection } from "../models/invoice/invoice.class"
import AppError from "../types/AppError"
import { Invoice, InvoiceCreationDTO } from "../types/invoices/Invoice"
import { AppliedDiscount } from "../types/discounts/AppliedDiscount"
import { Price } from "../types/Price"
import { logger } from "./LoggingService"
import { PaymentStatus } from "../types/enums/PaymentStatus"
import { PaymentType } from "../types/enums/PaymentType"

class InvoiceService {
  constructor(private _invoiceCollection: InvoiceCollection) {}

  private readonly _FILE_NAME = path.basename(__filename)

  async getClientEnrollmentHistory(userId: string, enrollmentId: string): Promise<Invoice[]> {
    logger.debugInside(this._FILE_NAME, this.getClientEnrollmentHistory.name, { userId, enrollmentId })
    try {
      const invoices = await this._invoiceCollection.model.find({
        userId,
        enrollmentId
      }).sort({ 'period.endDate': -1 })

      return invoices
    } catch (error) {
      throw new AppError('errors.resourceNotFound', 500)
    }
  }

  async getInvoicesByUserId(userId: string): Promise<Invoice[]> {
    logger.debugInside(this._FILE_NAME, this.getInvoicesByUserId.name, { userId })
    try {
      const invoices = await this._invoiceCollection.model.find({ userId }).sort({ 'period.endDate': -1 }).lean()
      return invoices as Invoice[]
    } catch (error) {
      throw new AppError('errors.resourceNotFound', 500)
    }
  }

  async getInvoice(invoiceId: string): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this.getInvoice.name, { invoiceId })

    try {
      const invoice = await this._invoiceCollection.findOne({ _id: invoiceId })
      return invoice as Invoice
    } catch (error) {
      throw new AppError('errors.resourceNotFound', 500)
    }
  }

  async getCurrentInvoice(invoiceIds: string[]): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this.getCurrentInvoice.name, { invoiceIds })
    try {
      const invoice = await this._invoiceCollection.getMostRecentInvoice(invoiceIds)
      return invoice as Invoice
    } catch (error) {
      throw new AppError('errors.resourceNotFound', 500)
    }
  }

  async getOldestUnpaidInvoice(invoiceIds: string[]): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this.getOldestUnpaidInvoice.name, { invoiceIds })

  if (!invoiceIds || invoiceIds.length === 0) {
    throw new AppError('errors.missingParameters', 400)
  }

  try {
    return await this._invoiceCollection.getOldestUnpaidInvoice(invoiceIds)
  } catch (error) {
    throw new AppError('errors.resourceNotFound', 500)
  }
  }

  async getInvoicesFromIds(invoiceIds: string[]): Promise<Invoice[]> {
    if (!invoiceIds || invoiceIds.length === 0) {
      throw new AppError('errors.missingParameters', 400)
    }
    
    try {
      const invoices = await this._invoiceCollection.find({ _id: { $in: invoiceIds } })
      return invoices.sort((a: Invoice, b: Invoice) => b.period.endDate.getTime() - a.period.endDate.getTime())
    } catch (error) {
      throw new AppError('errors.resourceNotFound', 500)
    }
  }

  async createInvoice(
    clientId: string, 
    enrollmentId: string, 
    originalPrice: Price,
    charge: Price, 
    startDate: Date, 
    endDate: Date, 
    paymentStatus?: PaymentStatus,
    discountsApplied?: AppliedDiscount[]
  ): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this.createInvoice.name, { 
      userId: clientId, 
      enrollmentId,
      originalPrice,
      charge,
      discountsCount: discountsApplied?.length || 0
    })
    
    // Determine payment status if not provided
    let invoicePaymentStatus = paymentStatus
    if (!invoicePaymentStatus) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const normalizedEndDate = new Date(endDate)
      normalizedEndDate.setHours(0, 0, 0, 0)
      
      // If the invoice end date has passed, it should be OVERDUE
      // Otherwise, check if it's within 4 days (ALMOST_DUE) or PENDING
      if (normalizedEndDate < today) {
        invoicePaymentStatus = PaymentStatus.OVERDUE
      } else {
        const fourDaysFromNow = new Date(today)
        fourDaysFromNow.setDate(today.getDate() + 4)
        if (normalizedEndDate >= today && normalizedEndDate <= fourDaysFromNow) {
          invoicePaymentStatus = PaymentStatus.ALMOST_DUE
        } else {
          invoicePaymentStatus = PaymentStatus.PENDING
        }
      }
    }
    
    const invoiceCreationDTO: InvoiceCreationDTO = {
      userId: clientId, 
      enrollmentId, 
      originalPrice,
      charge, 
      period: {
        startDate, 
        endDate
      },
      paymentStatus: invoicePaymentStatus,
      discountsApplied: discountsApplied || []
    }

    try {
      const invoiceExists = await this._invoiceCollection.invoiceExists(clientId, enrollmentId, startDate, endDate)

      if (invoiceExists) throw new AppError('errors.invoiceAlreadyExists', 400)

      logger.debugComplete(this._FILE_NAME, this.createInvoice.name)
      const invoice = await this._invoiceCollection.createInvoice(invoiceCreationDTO)
      return invoice as Invoice 
    } catch (error: any) {
      throw new AppError('errors.unableToCreateResource', 500)
    } 
  }

  async getAllInvoices(): Promise<Invoice[]> {
    logger.debugInside(this._FILE_NAME, this.getAllInvoices.name)
    try {
      const invoices = await this._invoiceCollection.model.find({}).lean()
      return invoices as Invoice[]
    } catch (error) {
      throw new AppError('errors.resourceNotFound', 500)
    }
  }

  async updateInvoiceCharge(
    invoiceId: string, 
    originalPrice: Price, 
    charge: Price, 
    discountsApplied?: AppliedDiscount[]
  ): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this.updateInvoiceCharge.name, { invoiceId, originalPrice, charge, discountsCount: discountsApplied?.length || 0 })
    try {
      // Get the current invoice to calculate payments
      const currentInvoice = await this.getInvoice(invoiceId)
      
      // Calculate total payments applied
      const totalPayments = currentInvoice.paymentsApplied?.reduce((sum, payment) => sum + payment.charge.amount, 0) || 0
      
      // Calculate new remaining balance (charge amount minus payments)
      const newRemainingBalance = Math.max(0, charge.amount - totalPayments)
      
      return await this._invoiceCollection.updateOne(
        { _id: invoiceId },
        { 
          $set: { 
            originalPrice: originalPrice,
            charge: charge,
            discountsApplied: discountsApplied || [],
            amountDue: charge.amount,
            remainingBalance: newRemainingBalance
          }
        }
      )
    } catch (error) {
      throw new AppError('errors.unableToUpdateResource', 500)
    }
  }

  async updateInvoiceAmounts(
    invoiceId: string,
    amountDue: number,
    remainingBalance: number
  ): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this.updateInvoiceAmounts.name, { invoiceId, amountDue, remainingBalance })
    try {
      return await this._invoiceCollection.updateOne(
        { _id: invoiceId },
        {
          $set: {
            amountDue,
            remainingBalance
          }
        }
      )
    } catch (error) {
      throw new AppError('errors.unableToUpdateResource', 500)
    }
  }

  async updateInvoicePeriodEndDate(
    invoiceId: string,
    newEndDate: Date,
    incrementBonusSessions?: boolean
  ): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this.updateInvoicePeriodEndDate.name, { invoiceId, newEndDate, incrementBonusSessions })
    try {
      const normalizedEndDate = new Date(newEndDate)
      normalizedEndDate.setHours(0, 0, 0, 0)
      
      const update: any = {
        'period.endDate': normalizedEndDate
      }
      
      if (incrementBonusSessions) {
        // Get current invoice to check existing bonusSessionsApplied
        const currentInvoice = await this.getInvoice(invoiceId)
        const currentBonusSessions = currentInvoice.bonusSessionsApplied || 0
        update.bonusSessionsApplied = currentBonusSessions + 1
      }
      
      return await this._invoiceCollection.updateOne(
        { _id: invoiceId },
        {
          $set: update
        }
      )
    } catch (error) {
      throw new AppError('errors.unableToUpdateResource', 500)
    }
  }

  async updateBonusSessionsApplied(
    invoiceId: string,
    bonusSessionsApplied: number
  ): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this.updateBonusSessionsApplied.name, { invoiceId, bonusSessionsApplied })
    try {
      return await this._invoiceCollection.updateOne(
        { _id: invoiceId },
        {
          $set: {
            bonusSessionsApplied
          }
        }
      )
    } catch (error) {
      throw new AppError('errors.unableToUpdateResource', 500)
    }
  }

  async applyPaymentToInvoice(
    invoiceId: string,
    userId: string,
    enrollmentId: string,
    amount: number,
    paymentType: PaymentType
  ): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this.applyPaymentToInvoice.name, {
      invoiceId,
      userId,
      enrollmentId,
      amount,
      paymentType
    })

    const invoice = await this.getInvoice(invoiceId)

    if (invoice.userId !== userId || invoice.enrollmentId !== enrollmentId) {
      throw new AppError('errors.resourceNotFound', 404)
    }

    if (
      invoice.paymentStatus === PaymentStatus.PAID
      || invoice.paymentStatus === PaymentStatus.CANCELLED
    ) {
      throw new AppError('errors.invoiceNotPayable', 400)
    }

    const totalPayments = (invoice.paymentsApplied || []).reduce(
      (sum, payment) => sum + payment.charge.amount,
      0
    )
    const remainingBalance = invoice.charge.amount - totalPayments

    if (amount <= 0) {
      throw new AppError('errors.invalidPaymentAmount', 400)
    }

    if (amount > remainingBalance) {
      throw new AppError('errors.paymentAmountExceedsRemaining', 400)
    }

    const payment = {
      charge: { amount, currency: invoice.charge.currency },
      date: new Date(),
      paymentType
    }

    const newTotalPayments = totalPayments + amount
    const newPaymentStatus = newTotalPayments >= invoice.charge.amount
      ? PaymentStatus.PAID
      : invoice.paymentStatus

    try {
      return await this._invoiceCollection.updateOne(
        { _id: invoiceId },
        {
          $push: { paymentsApplied: payment },
          $set: { paymentStatus: newPaymentStatus }
        }
      )
    } catch (error) {
      throw new AppError('errors.unableToUpdateResource', 500)
    }
  }
}

const invoiceService = new InvoiceService(invoiceCollection)
export { invoiceService, InvoiceService }