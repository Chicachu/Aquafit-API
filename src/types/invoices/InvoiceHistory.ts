import { Weekday } from "../enums/Weekday"
import { Invoice } from "../invoices/Invoice"

export type InvoiceHistory = {
  invoices: Invoice[]
  clientName: string
  classDetails: {
    classType: string
    classLocation: string
    days: Weekday[]
  }
}