import { Model, Types } from "mongoose";
import Collection from "../_common/collection.class";
import { IPaymentDocument, IPaymentModel, PaymentDocument, PaymentModel } from "./payment.schema";
import { Payment } from "../../types/Payment";

class PaymentCollection extends Collection<IPaymentDocument> {
  constructor(model: Model<IPaymentModel>) {
    super(model)
  }

  async getPaymentsByClientId(clientId: Types.ObjectId): Promise<PaymentDocument[]> {
    return await this.find({ clientId })
  }
  
  async createInvoice(payment: Payment): Promise<PaymentDocument> {
    return await this.insertOne(payment)
  } 
}

const paymentCollection = new PaymentCollection(PaymentModel)
export { paymentCollection, PaymentCollection }