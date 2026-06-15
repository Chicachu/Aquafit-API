import { IDocument } from "./IDocument"
import { Class } from "./Class"
import { ClassClientEnrollmentDetails } from "./ClassClientEnrollmentDetails"
import { User } from "./User"
import { Weekday } from "./enums/Weekday"

export type ClassInstructorSummary = {
  _id: string
  firstName: string
  lastName: string
}

export type ClassDetails = IDocument & Class & {
  clients: ClassClientEnrollmentDetails[]
  waitlistClients?: User[]
  enrollmentCounts: Partial<Record<Weekday, number>>
  instructor?: ClassInstructorSummary | null
}