import { Model } from "mongoose";
import Collection from "../_common/collection.class";
import { IPaymentDocument, IPaymentModel, PaymentDocument, PaymentModel } from "./invoice.schema";
import { Invoice, InvoiceCreationDTO } from "../../types/Invoice";

class InvoiceCollection extends Collection<IPaymentDocument> {
  constructor(model: Model<IPaymentModel>) {
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
    return await this.insertOne(invoice)
  } 
}

const invoiceCollection = new InvoiceCollection(PaymentModel)
export { invoiceCollection, InvoiceCollection }