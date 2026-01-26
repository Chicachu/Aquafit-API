import { PaymentType } from "../enums/PaymentType"
import { Price } from "../Price"

export type Payment = {
  charge: Price 
  date: Date
  paymentType: PaymentType
}