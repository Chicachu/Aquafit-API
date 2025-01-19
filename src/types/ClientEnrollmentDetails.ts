import { IDocument } from "./IDocument";
import { Payment } from "./Payment";

export type ClientEnrollmentDetails = IDocument & {
  fullName: string
  currentPayment: Payment
}