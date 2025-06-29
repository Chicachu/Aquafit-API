import { IDocument } from "../IDocument"
import { Price } from "../Price"
import { Currency } from "../enums/Currency"
import { PaymentStatus } from "../enums/PaymentStatus"
import { PaymentType } from "../enums/PaymentType"

export type Invoice = IDocument & {
  userId: string
  enrollmentId: string
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
  createdAt: Date
  updatedAt: Date
}


export type InvoiceCreationDTO = {
  userId: string
  enrollmentId: string 
  charge: Price
  period: {
    startDate: Date, 
    dueDate: Date
  }
  paymentStatus: PaymentStatus
  discountsApplied?: {
    discountId: string
    amountOverride: {
      amount: number
      currency: Currency
    }
  }[] 
}