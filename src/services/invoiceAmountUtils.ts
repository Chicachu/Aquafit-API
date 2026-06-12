import { Invoice } from '../types/invoices/Invoice'

type InvoiceAmountSource = Pick<Invoice, 'charge' | 'paymentsApplied'>

export function getTotalAppliedPayments(invoice: InvoiceAmountSource): number {
  return (invoice.paymentsApplied || []).reduce(
    (sum, payment) => sum + (payment.charge?.amount ?? 0),
    0
  )
}

export function computeInvoiceAmounts(invoice: InvoiceAmountSource): {
  amountDue: number
  remainingBalance: number
  totalApplied: number
} {
  const amountDue = invoice.charge?.amount ?? 0
  const totalApplied = getTotalAppliedPayments(invoice)
  const remainingBalance = amountDue - totalApplied

  return { amountDue, remainingBalance, totalApplied }
}

export function withInvoiceAmounts<T extends InvoiceAmountSource>(invoice: T): T & {
  amountDue: number
  remainingBalance: number
} {
  const { amountDue, remainingBalance } = computeInvoiceAmounts(invoice)
  return { ...invoice, amountDue, remainingBalance }
}
