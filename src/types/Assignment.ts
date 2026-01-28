import { IDocument } from "./IDocument";
import { Price } from "./Price";
import { AssignmentStatus } from "./enums/AssignmentStatus";

export type Assignment = IDocument & {
  instructorId: string
  classId: string
  startDate: Date
  endDate?: Date | null
  paymentValue?: Price | null
  status?: AssignmentStatus
}

export type AssignmentCreationDTO = {
  instructorId: string
  classId: string
  startDate: Date
  endDate?: Date | null
  paymentValue?: Price | null
}

export type AssignmentUpdateOptions = {
  startDate?: Date
  endDate?: Date | null
  paymentValue?: Price | null
}
