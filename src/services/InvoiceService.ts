import path from "path"
import { invoiceCollection, InvoiceCollection } from "../models/invoice/invoice.class"
import AppError from "../types/AppError"
import { Invoice, InvoiceCreationDTO } from "../types/Invoice"
import { Price } from "../types/Price"
import { logger } from "./LoggingService"

class InvoiceService {
  constructor(private _invoiceCollection: InvoiceCollection) {}

  private readonly _FILE_NAME = path.basename(__filename)

  async createInvoice(clientId: string, enrollmentId: string, charge: Price, startDate: Date, dueDate: Date): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this.createInvoice.name, { userId: clientId, enrollmentId })
    const invoiceCreationDTO: InvoiceCreationDTO = {
      userId: clientId, 
      enrollmentId, 
      charge, 
      period: {
        startDate, 
        dueDate
      }
    }

    try {
      const invoiceExists = await this._invoiceCollection.invoiceExists(clientId, enrollmentId, startDate, dueDate)

      if (invoiceExists) throw new AppError('errors.invoiceAlreadyExists', 400)

      logger.debugComplete(this._FILE_NAME, this.createInvoice.name)
      return await this._invoiceCollection.createInvoice(invoiceCreationDTO)
    } catch (error: any) {
      throw new AppError(error.message, 500)
    } 
  }

  async getAllInvoicesForClass(enrollmentIds: string[], clientIds: string[]): Promise<Invoice[]> {
    logger.debugInside(this._FILE_NAME, this.getAllInvoicesForClass.name)
    return await this._invoiceCollection.getAllPaymentsForClass(enrollmentIds, clientIds)
  }
}

const invoiceService = new InvoiceService(invoiceCollection)
export { invoiceService, InvoiceService }