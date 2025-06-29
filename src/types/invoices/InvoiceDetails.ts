import { Currency } from "../enums/Currency"
import { PaymentStatus } from "../enums/PaymentStatus"
import { PaymentType } from "../enums/PaymentType"
import { Weekday } from "../enums/Weekday"
import { Price } from "../Price"

export type InvoiceDetails = {
  clientName: string 
  classDetails: {
    classType: string
    classLocation: string
    days: Weekday[]
  }
  charge: Price 
  discountsApplied?: {
      discountId?: string | null
      amountOverride?: {
        amount: number
        currency: Currency
      } | null
      amountSnapshot?: {
        amount: number
        currency: Currency
      } | null
      description?: string | null
    }[]
    paymentsApplied: {
      amount: number
      currency: Currency
      date: Date
      paymentType: PaymentType
    }[]
    paymentStatus: PaymentStatus
    period: {
      startDate: Date
      dueDate: Date
    }
}