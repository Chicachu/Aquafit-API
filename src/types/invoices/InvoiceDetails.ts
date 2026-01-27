import { Currency } from "../enums/Currency"
import { PaymentStatus } from "../enums/PaymentStatus"
import { PaymentType } from "../enums/PaymentType"
import { Weekday } from "../enums/Weekday"
import { Period } from "../Period"
import { Price } from "../Price"

import { AppliedDiscount } from "../discounts/AppliedDiscount"

export type InvoiceDetails = {
  clientName: string 
  classDetails: {
    classType: string
    classLocation: string
    days: Weekday[]
  }
  originalPrice?: Price
  charge: Price 
  discountsApplied?: AppliedDiscount[]
  paymentsApplied: {
    charge: Price
    date: Date
    paymentType: PaymentType
  }[]
  paymentStatus: PaymentStatus
  period: Period
}