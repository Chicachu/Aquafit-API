import path from "path"
import { invoiceCollection, InvoiceCollection } from "../models/invoice/invoice.class"
import AppError from "../types/AppError"
import { Invoice, InvoiceCreationDTO } from "../types/Invoice"
import { Price } from "../types/Price"
import { logger } from "./LoggingService"

class InvoiceService {
  constructor(private _invoiceCollection: InvoiceCollection) {}

  private readonly _FILE_NAME = path.basename(__filename)

  async getCurrentInvoice(invoiceIds: string[]): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this.getCurrentInvoice.name, { invoiceIds })
    try {
      return await this._invoiceCollection.getMostRecentInvoice(invoiceIds)
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
      }
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