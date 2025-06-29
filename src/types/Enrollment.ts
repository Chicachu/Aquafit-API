import { BillingFrequency } from "./enums/BillingFrequency"
import { Currency } from "./enums/Currency"
import { Weekday } from "./enums/Weekday"
import { IDocument } from "./IDocument"

export type Enrollment = IDocument & {
  userId: string
  classId: string
  startDate: Date
  billingFrequencyOverride: BillingFrequency
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
  autoEnrollment: boolean
  invoiceIds: string[]
}

export type EnrollmentCreationDTO = {
  userId: string
  classId: string
  startDate: Date
  billingFrequencyOverride?: BillingFrequency
  daysOfWeekOverride?: Weekday[]
  autoEnrollment: boolean
}
