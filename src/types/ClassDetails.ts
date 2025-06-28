import { IDocument } from "./IDocument"
import { Class } from "./Class"
import { ClassClientEnrollmentDetails } from "./ClassClientEnrollmentDetails"
import { User } from "./User"
import { Weekday } from "./enums/Weekday"

export type ClassDetails = IDocument & Class & {
  clients: ClassClientEnrollmentDetails[]
  waitlistClients?: User[]
  enrollmentCounts: Partial<Record<Weekday, number>>
}