import { BillingFrequency } from "./enums/BillingFrequency"
import { Currency } from "./enums/Currency"
import { Weekday } from "./enums/Weekday"
import { IDocument } from "./IDocument"
import { EnrollmentStatus } from "./enums/EnrollmentStatus"

export type Enrollment = IDocument & {
  userId: string
  classId: string
  startDate: Date
  status: EnrollmentStatus
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
  bonusSessionsConsumed?: number
  isTrial?: boolean
  endDate?: Date
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
