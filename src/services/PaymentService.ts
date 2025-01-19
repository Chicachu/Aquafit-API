import { PaymentCollection, paymentCollection } from "../models/payment/payment.class"
import { Payment } from "../types/Payment"

class PaymentService {
  constructor(private paymentCollection: PaymentCollection) {}

  async getAllPaymentsForClass(enrollmentIds: string[], clientIds: string[]): Promise<Payment[]> {
    return await this.paymentCollection.getAllPaymentsForClass(enrollmentIds, clientIds)
  }
}
const paymentService = new PaymentService(paymentCollection)
export { paymentService, PaymentService }