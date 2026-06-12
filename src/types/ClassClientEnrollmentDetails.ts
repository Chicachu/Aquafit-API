import { Invoice } from "./invoices/Invoice"
import { Weekday } from "./enums/Weekday"

export type ClassClientEnrollmentDetails = {
  _id: string
  enrollmentId: string
  firstName: string
  lastName: string
  currentPayment?: Invoice | null
  isPartiallyEnrolled?: boolean
  daysOfWeekOverride?: Weekday[]
}