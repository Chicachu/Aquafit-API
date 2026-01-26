import { DiscountContext } from "./DiscountContext"

export type PartialEnrollmentContext = DiscountContext & {
  daysAttending: number
  totalDaysInClass: number
}