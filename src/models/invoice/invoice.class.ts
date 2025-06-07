import { Model } from "mongoose";
import Collection from "../_common/collection.class";
import {  IInvoiceDocument, IInvoiceModel, InvoiceModel } from "./invoice.schema";
import { Invoice, InvoiceCreationDTO } from "../../types/Invoice";

class InvoiceCollection extends Collection<IInvoiceDocument> {
  constructor(model: Model<IInvoiceModel>) {
    super(model)
  }

  async getAllPaymentsForClass(enrollmentIds: string[], clientIds: string[]): Promise<Invoice[]> {
    return await this.find({
      $and: [
        { enrollmentId: { $in: enrollmentIds } },
        { clientId: { $in: clientIds } }
      ]
    })
  }

  async getPaymentsByClientId(clientId: string): Promise<Invoice> {
    return await this.find({ clientId })
  }
  
  async createInvoice(invoice: InvoiceCreationDTO): Promise<Invoice> {
    try {
      return await this.insertOne(invoice)
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
}

const invoiceCollection = new InvoiceCollection(InvoiceModel)
export { invoiceCollection, InvoiceCollection }