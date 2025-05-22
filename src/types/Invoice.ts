import { IDocument } from "./IDocument"
import { Price } from "./Price"
import { Currency } from "./enums/Currency"
import { PaymentStatus } from "./enums/PaymentStatus"

export type Invoice = IDocument & {
  clientId: string
  enrollmentId: string
  charge: Price 
  discountsApplied: {
    discountId: string
    amountOverride: {
      amount: number
      currency: Currency
    }
  }[]
  paymentsHistory: {
    amount: number
    currency: Currency
    date: Date
  }[]
  paymentStatus: PaymentStatus
  period: {
    startDate: Date, 
    dueDate: Date
  }
}

export type InvoiceCreationDTO = {
  userId: string
  enrollmentId: string 
  charge: Price
  period: {
    startDate: Date, 
    dueDate: Date
  }
  discountsApplied?: {
    discountId: string
    amountOverride: {
      amount: number
      currency: Currency
    }
  }[] 
}