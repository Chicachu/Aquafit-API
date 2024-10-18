import { IDocument } from "./IDocument";

export type Enrollment = IDocument & {
  userId: string
  classId: string
  startDate: Date
  bonusSessions?: number
}