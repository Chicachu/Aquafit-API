import { IDocument } from "./IDocument"
import { Currency } from "./enums/Currency"
import { PaymentStatus } from "./enums/PaymentStatus"

export type Payment = IDocument & {
  clientId: string
  enrollmentId: string
  amount: {
    currency: Currency
    value: number
  }
  discountsApplied: {
    discountId: string
    amount: number
  }[]
  paymentsHistory: {
    currency: Currency
    value: number
    date: Date
  }[]
  paymentStatus: PaymentStatus
  period: {
    start: Date, 
    duteDate: Date
  }
}