import { IDocument } from "./IDocument"
import { Class } from "./Class"
import { ClassClientEnrollmentDetails } from "./ClassClientEnrollmentDetails"
import { User } from "./User"

export type ClassDetails = IDocument & Class & {
  clients: ClassClientEnrollmentDetails[]
  waitlistClients?: User[]
}