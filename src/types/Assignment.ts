import { IDocument } from "./IDocument";

export type Assignment = IDocument & {
  instructorId: string
  classId: string
  startDate: Date
  endDate?: Date | null
}

export type AssignmentCreationDTO = {
  instructorId: string
  classId: string
  startDate: Date
  endDate?: Date | null
}

export type AssignmentUpdateOptions = {
  startDate?: Date
  endDate?: Date | null
}
