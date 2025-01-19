import { IDocument } from "./IDocument"
import { Class } from "./Class"
import { ClientEnrollmentDetails } from "./ClientEnrollmentDetails"

export type ClassDetails = IDocument & Class & {
  clients: ClientEnrollmentDetails[]
  waitlistClients?: User[]
}