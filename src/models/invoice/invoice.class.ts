import { Model } from "mongoose"
import Collection from "../_common/collection.class"
import { InvoiceDocument, IInvoiceModel, InvoiceModel } from "./invoice.schema"
import { InvoiceCreationDTO } from "../../types/invoices/Invoice"
import AppError from "../../types/AppError"
import { PaymentStatus } from "../../types/enums/PaymentStatus"
import { logger } from "../../services/LoggingService"
import { addBusinessDays, toBusinessStartOfDay } from "../../services/dateUtils"
import { businessDateDayQuery, formatBusinessDateKey } from "../../services/scheduleDateUtils"
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
      'period.startDate': businessDateDayQuery(startDate),
      'period.endDate': businessDateDayQuery(endDate)
    })

    return !!existingInvoice
  }

  async updatePaymentStatuses(): Promise<void> {
    logger.debugInside(this._FILE_NAME, this.updatePaymentStatuses.name)
    const today = toBusinessStartOfDay(new Date())
    const todayKey = formatBusinessDateKey(today)
    const fourDaysFromNowKey = formatBusinessDateKey(addBusinessDays(today, 4))
  
    const invoicesToUpdate = await this.model.find({
      paymentStatus: { $in: [PaymentStatus.PENDING, PaymentStatus.ALMOST_DUE] }
    })
  
    logger.debugInside(this._FILE_NAME, this.updatePaymentStatuses.name, { 
      foundInvoices: invoicesToUpdate.length,
      today: today.toISOString(),
      fourDaysFromNow: fourDaysFromNowKey
    })
  
    const bulkOps = invoicesToUpdate.map(invoice => {
      const endDateKey = formatBusinessDateKey(invoice.period.endDate)

      let newStatus = PaymentStatus.PENDING

      if (endDateKey < todayKey) {
        newStatus = PaymentStatus.OVERDUE
      } else if (endDateKey >= todayKey && endDateKey <= fourDaysFromNowKey) {
        newStatus = PaymentStatus.ALMOST_DUE
      }
  
      if (newStatus !== invoice.paymentStatus) {
        logger.debugInside(this._FILE_NAME, this.updatePaymentStatuses.name, {
          invoiceId: invoice._id,
          currentStatus: invoice.paymentStatus,
          newStatus: newStatus,
          endDate: endDateKey
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