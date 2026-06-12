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
      .sort({ 'period.endDate': 1 }) 
      .limit(1)
      .lean()
      .then(invoices => invoices[0] || null)

      return invoice as InvoiceDocument
    } catch (error) {
      throw error
    }
  }

  async invoiceExists(clientId: string, enrollmentId: string, startDate: Date, endDate: Date): Promise<Boolean> {
    const existingInvoice = await this.findOne({
      userId: clientId,
      enrollmentId,
      'period.startDate': {
        $gte: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0),
        $lt: new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 1, 0, 0, 0)
      },
      'period.endDate': {
        $gte: new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 0, 0, 0),
        $lt: new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() + 1, 0, 0, 0)
      }
    })

    return !!existingInvoice
  }

  async updatePaymentStatuses(): Promise<void> {
    logger.debugInside(this._FILE_NAME, this.updatePaymentStatuses.name)
    const now = new Date()
    // Normalize to start of day for accurate date comparison
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const fourDaysFromNow = new Date(today)
    fourDaysFromNow.setDate(today.getDate() + 4)
  
    const invoicesToUpdate = await this.model.find({
      paymentStatus: { $in: [PaymentStatus.PENDING, PaymentStatus.ALMOST_DUE] }
    })
  
    logger.debugInside(this._FILE_NAME, this.updatePaymentStatuses.name, { 
      foundInvoices: invoicesToUpdate.length,
      today: today.toISOString(),
      fourDaysFromNow: fourDaysFromNow.toISOString()
    })
  
    const bulkOps = invoicesToUpdate.map(invoice => {
      const endDate = new Date(invoice.period.endDate)
      // Normalize endDate to start of day for comparison
      const endDateNormalized = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
      
      let newStatus = PaymentStatus.PENDING
      
      if (endDateNormalized < today) {
        newStatus = PaymentStatus.OVERDUE
      } else if (endDateNormalized >= today && endDateNormalized <= fourDaysFromNow) {
        newStatus = PaymentStatus.ALMOST_DUE
      } 
  
      if (newStatus !== invoice.paymentStatus) {
        logger.debugInside(this._FILE_NAME, this.updatePaymentStatuses.name, {
          invoiceId: invoice._id,
          currentStatus: invoice.paymentStatus,
          newStatus: newStatus,
          endDate: endDateNormalized.toISOString()
        })
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
      logger.debugInside(this._FILE_NAME, this.updatePaymentStatuses.name, { updatedCount: bulkOps.length })
    } else {
      logger.debugInside(this._FILE_NAME, this.updatePaymentStatuses.name, { message: 'No invoices to update' })
    }
    
    logger.debugComplete(this._FILE_NAME, this.updatePaymentStatuses.name)
  }
}

const invoiceCollection = new InvoiceCollection(InvoiceModel)
export { invoiceCollection, InvoiceCollection }