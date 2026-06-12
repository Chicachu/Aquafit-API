import path from "path"
import { invoiceCollection, InvoiceCollection } from "../models/invoice/invoice.class"
import AppError from "../types/AppError"
import { Invoice, InvoiceCreationDTO } from "../types/invoices/Invoice"
import { AppliedDiscount } from "../types/discounts/AppliedDiscount"
import { Price } from "../types/Price"
import { logger } from "./LoggingService"
import { PaymentStatus } from "../types/enums/PaymentStatus"
import { PaymentType } from "../types/enums/PaymentType"
import { computeInvoiceAmounts, withInvoiceAmounts } from "./invoiceAmountUtils"
import { addBusinessDays, toBusinessStartOfDay } from "./dateUtils"
import { formatBusinessDateKey } from "./scheduleDateUtils"

class InvoiceService {
  constructor(private _invoiceCollection: InvoiceCollection) {}

  private readonly _FILE_NAME = path.basename(__filename)

  private _asInvoice(invoice: Invoice | null | undefined): Invoice {
    if (!invoice) {
      throw new AppError('errors.resourceNotFound', 404)
    }

    return withInvoiceAmounts(invoice) as Invoice
  }

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
      return (invoices as Invoice[]).map(invoice => withInvoiceAmounts(invoice) as Invoice)
    } catch (error) {
      throw new AppError('errors.resourceNotFound', 500)
    }
  }

  async getInvoice(invoiceId: string): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this.getInvoice.name, { invoiceId })

    try {
      const invoice = await this._invoiceCollection.findOne({ _id: invoiceId })
      return this._asInvoice(invoice as Invoice)
    } catch (error) {
      throw new AppError('errors.resourceNotFound', 500)
    }
  }

  async getCurrentInvoice(invoiceIds: string[]): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this.getCurrentInvoice.name, { invoiceIds })
    try {
      const invoice = await this._invoiceCollection.getMostRecentInvoice(invoiceIds)
      return this._asInvoice(invoice as Invoice)
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
    return this._asInvoice(await this._invoiceCollection.getOldestUnpaidInvoice(invoiceIds) as Invoice)
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
      return invoices
        .sort((a: Invoice, b: Invoice) => b.period.endDate.getTime() - a.period.endDate.getTime())
        .map((invoice: Invoice) => withInvoiceAmounts(invoice) as Invoice)
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
    const normalizedStartDate = toBusinessStartOfDay(startDate)
    const normalizedEndDate = toBusinessStartOfDay(endDate)

    if (!invoicePaymentStatus) {
      const today = toBusinessStartOfDay(new Date())
      const todayKey = formatBusinessDateKey(today)
      const endKey = formatBusinessDateKey(normalizedEndDate)

      if (endKey < todayKey) {
        invoicePaymentStatus = PaymentStatus.OVERDUE
      } else {
        const fourDaysFromNow = formatBusinessDateKey(addBusinessDays(today, 4))
        if (endKey >= todayKey && endKey <= fourDaysFromNow) {
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
        startDate: normalizedStartDate,
        endDate: normalizedEndDate
      },
      paymentStatus: invoicePaymentStatus,
      discountsApplied: discountsApplied || []
    }

    try {
      const invoiceExists = await this._invoiceCollection.invoiceExists(
        clientId,
        enrollmentId,
        normalizedStartDate,
        normalizedEndDate
      )

      if (invoiceExists) throw new AppError('errors.invoiceAlreadyExists', 400)

      logger.debugComplete(this._FILE_NAME, this.createInvoice.name)
      const invoice = await this._invoiceCollection.createInvoice(invoiceCreationDTO)
      return this._asInvoice(invoice as Invoice)
    } catch (error: any) {
      throw new AppError('errors.unableToCreateResource', 500)
    } 
  }

  async getAllInvoices(): Promise<Invoice[]> {
    logger.debugInside(this._FILE_NAME, this.getAllInvoices.name)
    try {
      const invoices = await this._invoiceCollection.model.find({}).lean()
      return (invoices as Invoice[]).map(invoice => withInvoiceAmounts(invoice) as Invoice)
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
      // Get the current invoice to validate it exists before updating charge/discounts
      await this.getInvoice(invoiceId)
      
      return this._asInvoice(await this._invoiceCollection.updateOne(
        { _id: invoiceId },
        { 
          $set: { 
            originalPrice: originalPrice,
            charge: charge,
            discountsApplied: discountsApplied || []
          }
        }
      ) as Invoice)
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
      const update: any = {
        'period.endDate': toBusinessStartOfDay(newEndDate)
      }
      
      if (incrementBonusSessions) {
        // Get current invoice to check existing bonusSessionsApplied
        const currentInvoice = await this.getInvoice(invoiceId)
        const currentBonusSessions = currentInvoice.bonusSessionsApplied || 0
        update.bonusSessionsApplied = currentBonusSessions + 1
      }
      
      return this._asInvoice(await this._invoiceCollection.updateOne(
        { _id: invoiceId },
        {
          $set: update
        }
      ) as Invoice)
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
      return this._asInvoice(await this._invoiceCollection.updateOne(
        { _id: invoiceId },
        {
          $set: {
            bonusSessionsApplied
          }
        }
      ) as Invoice)
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

    const { remainingBalance, totalApplied } = computeInvoiceAmounts(invoice)

    if (amount <= 0) {
      throw new AppError('errors.invalidPaymentAmount', 400)
    }

    const appliedAmount = Math.min(amount, remainingBalance)
    const changeDue = Math.max(0, amount - remainingBalance)

    const payment: {
      charge: { amount: number; currency: typeof invoice.charge.currency }
      amountTendered: { amount: number; currency: typeof invoice.charge.currency }
      changeDue?: { amount: number; currency: typeof invoice.charge.currency }
      date: Date
      paymentType: PaymentType
    } = {
      charge: { amount: appliedAmount, currency: invoice.charge.currency },
      amountTendered: { amount, currency: invoice.charge.currency },
      date: new Date(),
      paymentType
    }

    if (changeDue > 0) {
      payment.changeDue = { amount: changeDue, currency: invoice.charge.currency }
    }

    const newTotalPayments = totalApplied + appliedAmount
    const newPaymentStatus = newTotalPayments >= invoice.charge.amount
      ? PaymentStatus.PAID
      : invoice.paymentStatus

    try {
      return this._asInvoice(await this._invoiceCollection.updateOne(
        { _id: invoiceId },
        {
          $push: { paymentsApplied: payment },
          $set: { paymentStatus: newPaymentStatus }
        }
      ) as Invoice)
    } catch (error) {
      throw new AppError('errors.unableToUpdateResource', 500)
    }
  }
}

const invoiceService = new InvoiceService(invoiceCollection)
export { invoiceService, InvoiceService }