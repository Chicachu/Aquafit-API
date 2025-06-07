import { IDocument } from "./IDocument"
import { Price } from "./Price"
import { Currency } from "./enums/Currency"
import { PaymentStatus } from "./enums/PaymentStatus"
import { PaymentType } from "./enums/PaymentType"

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
  paymentsApplied: {
    amount: number
    currency: Currency
    date: Date
    paymentType: PaymentType
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