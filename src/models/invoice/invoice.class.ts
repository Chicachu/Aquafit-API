import { Model } from "mongoose"
import Collection from "../_common/collection.class"
import { InvoiceDocument, IInvoiceModel, InvoiceModel } from "./invoice.schema"
import { InvoiceCreationDTO } from "../../types/invoices/Invoice"
import AppError from "../../types/AppError"
import { PaymentStatus } from "../../types/enums/PaymentStatus"
import { logger } from "../../services/LoggingService"
import path from "path"

class InvoiceCollection extends Collection<IInvoiceModel> {
  constructor(model: Model<IInvoiceModel>) {
    super(model)
  }

  private readonly _FILE_NAME = path.basename(__filename)

  async getPaymentsByClientId(clientId: string): Promise<InvoiceDocument> {
    return await this.find({ clientId })
  }
  
  async createInvoice(invoice: InvoiceCreationDTO): Promise<InvoiceDocument> {
    try {
      return await this.insertOne(invoice)
    } catch (error) {
      throw error
    }
  } 

  async getMostRecentInvoice(invoiceIds: string[]): Promise<InvoiceDocument> {
    logger.debugInside(this._FILE_NAME, this.getMostRecentInvoice.name, { invoiceIds })
    if (!invoiceIds || invoiceIds.length === 0) throw new AppError('errors.missingParameters', 400)

    try {
      const invoice = await this.model
        .find({ _id: { $in: invoiceIds } })
        .sort({ 'period.startDate': -1 }) 
        .limit(1)
        .lean()
        .then(invoices => invoices[0] || null)
        
      return invoice as InvoiceDocument
    }
    catch (error) {
      throw error
    }
  }

  async getOldestUnpaidInvoice(invoiceIds: string[]): Promise<InvoiceDocument> {
    logger.debugInside(this._FILE_NAME, this.getOldestUnpaidInvoice.name, { invoiceIds })
    try {
      const invoice = await this.model.find({
        _id: { $in: invoiceIds },
        paymentStatus: { $ne: 'paid' } 
      })
      .sort({ 'period.dueDate': 1 }) 
      .limit(1)
      .then(invoices => invoices[0] || null)

      return invoice
    } catch (error) {
      throw error
    }
  }

  async invoiceExists(clientId: string, enrollmentId: string, startDate: Date, dueDate: Date): Promise<Boolean> {
    const existingInvoice = await this.findOne({
      userId: clientId,
      enrollmentId,
      'period.startDate': {
        $gte: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0),
        $lt: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1, 0, 0, 0)
      },
      'period.dueDate': {
        $gte: new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 0, 0, 0),
        $lt: new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() + 1, 0, 0, 0)
      }
    })

    return !!existingInvoice
  }

  async updatePaymentStatuses(): Promise<void> {
    logger.debugInside(this._FILE_NAME, this.updatePaymentStatuses.name)
    const now = new Date()
    const fourDaysFromNow = new Date()
    fourDaysFromNow.setDate(now.getDate() + 4)
  
    const invoicesToUpdate = await this.model.find({
      paymentStatus: { $in: [PaymentStatus.PENDING, PaymentStatus.ALMOST_DUE] }
    })
  
    const bulkOps = invoicesToUpdate.map(invoice => {
      const dueDate = invoice.period.dueDate
  
      let newStatus = PaymentStatus.PENDING
  
      if (dueDate < now) {
        newStatus = PaymentStatus.OVERDUE
      } else if (dueDate >= now && dueDate <= fourDaysFromNow) {
        newStatus = PaymentStatus.ALMOST_DUE
      } 
  
      if (newStatus !== invoice.paymentStatus) {
        return {
          updateOne: {
            filter: { _id: invoice._id },
            update: { paymentStatus: newStatus }
          }
        }
      }
  
      return null
    }).filter(op => op !== null)
  
    if (bulkOps.length > 0) {
      await this.model.bulkWrite(bulkOps)
    }
    
    logger.debugComplete(this._FILE_NAME, this.updatePaymentStatuses.name)
  }
}

const invoiceCollection = new InvoiceCollection(InvoiceModel)
export { invoiceCollection, InvoiceCollection }