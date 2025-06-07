import { IDocument } from "./IDocument";
import { Invoice } from "./Invoice";

export type ClassClientEnrollmentDetails = IDocument & {
  firstName: string
  lastName: string
  currentPayment: Invoice
}