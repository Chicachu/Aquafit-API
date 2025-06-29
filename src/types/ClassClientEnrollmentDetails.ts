import { Invoice } from "./invoices/Invoice"

export type ClassClientEnrollmentDetails = {
  _id: string
  firstName: string
  lastName: string
  currentPayment: Invoice
}