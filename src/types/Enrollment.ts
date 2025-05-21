import { BillingFrequency } from "./enums/BillingFrequency";
import { Currency } from "./enums/Currency";
import { Weekday } from "./enums/Weekday";
import { IDocument } from "./IDocument";
import { Invoice } from "./Invoice";

export type Enrollment = IDocument & {
  userId: string
  classId: string
  startDate: Date
  billingFrequency: BillingFrequency
  discountsApplied: {
    discountId: string
    amountOverride: {
      amount: number 
      currency: Currency
    }
    amountSnapshot: {
      amount: number 
      currency: Currency
    }
    description: string
  }[]
  daysOfWeekOverride?: Weekday[]
  bonusSessions?: number
  isTrial?: boolean
  cancelDate?: Date
  cancelReason?: string
  invoiceIds: string[]
}

export type EnrollmentCreationDTO = {
  userId: string
  classId: string
  startDate: Date
  billingFrequency: BillingFrequency
}