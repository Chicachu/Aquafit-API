import { invoiceCollection, InvoiceCollection } from "../models/invoice/invoice.class"
import AppError from "../types/AppError"
import { Invoice, InvoiceCreationDTO } from "../types/Invoice"
import { Price } from "../types/Price"
import i18n from '../../config/i18n'

class InvoiceService {
  constructor(private _invoiceCollection: InvoiceCollection) {}

  async createInvoice(clientId: string, enrollmentId: string, charge: Price, startDate: Date, dueDate: Date): Promise<Invoice> {
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

      if (invoiceExists) throw new AppError(i18n.__('errors.invoiceAlreadyExists'), 400)

      return await this._invoiceCollection.createInvoice(invoiceCreationDTO)
    } catch (error: any) {
      throw new AppError(error.message, 500)
    } 
  }

  async getAllInvoicesForClass(enrollmentIds: string[], clientIds: string[]): Promise<Invoice[]> {
    return await this._invoiceCollection.getAllPaymentsForClass(enrollmentIds, clientIds)
  }
}

const invoiceService = new InvoiceService(invoiceCollection)
export { invoiceService, InvoiceService }