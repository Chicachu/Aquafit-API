import { PaymentType } from "../enums/PaymentType"
import { Price } from "../Price"

export type Payment = {
  charge: Price
  amountTendered?: Price | null
  changeDue?: Price | null
  date: Date
  paymentType: PaymentType
}