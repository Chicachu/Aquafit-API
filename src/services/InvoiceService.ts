import path from "path"
import { invoiceCollection, InvoiceCollection } from "../models/invoice/invoice.class"
import AppError from "../types/AppError"
import { Invoice, InvoiceCreationDTO } from "../types/invoices/Invoice"
import { AppliedDiscount } from "../types/discounts/AppliedDiscount"
import { Price } from "../types/Price"
import { logger } from "./LoggingService"
import { PaymentStatus } from "../types/enums/PaymentStatus"

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

  async getInvoice(invoiceId: string): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this.getInvoice.name, { invoiceId })

    try {
      return await this._invoiceCollection.findOne({ _id: invoiceId })
    } catch (error) {
      throw new AppError('errors.resourceNotFound', 500)
    }
  }

  async getCurrentInvoice(invoiceIds: string[]): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this.getCurrentInvoice.name, { invoiceIds })
    try {
      return await this._invoiceCollection.getMostRecentInvoice(invoiceIds)
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
      return await this._invoiceCollection.createInvoice(invoiceCreationDTO) 
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
}

const invoiceService = new InvoiceService(invoiceCollection)
export { invoiceService, InvoiceService }