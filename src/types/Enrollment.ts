import { IDocument } from "./IDocument";
import { Payment } from "./Payment";

export type Enrollment = IDocument & {
  userId: string
  classId: string
  startDate: Date
  bonusSessions?: number
  payment: Payment
}