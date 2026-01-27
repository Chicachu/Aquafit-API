import { IDocument } from "../IDocument"
import { Period } from "../Period"
import { Price } from "../Price"
import { AppliedDiscount } from "../discounts/AppliedDiscount"
import { Currency } from "../enums/Currency"
import { PaymentStatus } from "../enums/PaymentStatus"
import { Payment } from "./Payment"

export type Invoice = IDocument & {
  userId: string
  enrollmentId: string
  originalPrice: Price
  charge: Price
  amountDue: number
  remainingBalance: number
  discountsApplied?: AppliedDiscount[]
  paymentsApplied: Payment[]
  paymentStatus: PaymentStatus
  period: Period
  createdAt: Date
  updatedAt: Date
}


export type InvoiceCreationDTO = {
  userId: string
  enrollmentId: string 
  originalPrice: Price
  charge: Price
  period: Period
  paymentStatus: PaymentStatus
  discountsApplied?: AppliedDiscount[]
}