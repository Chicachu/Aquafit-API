import path from "path"
import { invoiceCollection, InvoiceCollection } from "../models/invoice/invoice.class"
import AppError from "../types/AppError"
import { Invoice, InvoiceCreationDTO } from "../types/invoices/Invoice"
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
      }).sort({ 'period.dueDate': -1 })

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
      return invoices.sort((a: Invoice, b: Invoice) => b.period.dueDate.getTime() - a.period.dueDate.getTime())
    } catch (error) {
      throw new AppError('errors.resourceNotFound', 500)
    }
  }

  async createInvoice(clientId: string, enrollmentId: string, charge: Price, startDate: Date, dueDate: Date): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this.createInvoice.name, { userId: clientId, enrollmentId })
    const invoiceCreationDTO: InvoiceCreationDTO = {
      userId: clientId, 
      enrollmentId, 
      charge, 
      period: {
        startDate, 
        dueDate
      },
      paymentStatus: PaymentStatus.PENDING
    }

    try {
      const invoiceExists = await this._invoiceCollection.invoiceExists(clientId, enrollmentId, startDate, dueDate)

      if (invoiceExists) throw new AppError('errors.invoiceAlreadyExists', 400)

      logger.debugComplete(this._FILE_NAME, this.createInvoice.name)
      return await this._invoiceCollection.createInvoice(invoiceCreationDTO) 
    } catch (error: any) {
      throw new AppError('errors.unableToCreateResource', 500)
    } 
  }
}

const invoiceService = new InvoiceService(invoiceCollection)
export { invoiceService, InvoiceService }