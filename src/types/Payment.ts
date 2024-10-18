import { IDocument } from "./IDocument"
import { PaymentStatus } from "./enums/PaymentStatus"

export type Payment = IDocument & {
  clientId: string
  enrollmentId: string
  amountDue: {
    currency: string
    value: number
  }
  discount: number
  paymentStatus: PaymentStatus
  dueDate: Date
}