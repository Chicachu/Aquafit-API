import { clientHandler } from '../business/ClientHandler'
import { invoiceService } from './InvoiceService'
import { usersService } from './UsersService'
import * as employeePayableService from './EmployeePayableService'
import { InvoiceDetails } from '../types/invoices/InvoiceDetails'
import { InvoiceHistory } from '../types/invoices/InvoiceHistory'
import { PaymentType } from '../types/enums/PaymentType'
import { EmployeePayable } from '../types/EmployeePayable'
import { Invoice } from '../types/invoices/Invoice'

export type InvoicesByUserIdResult = {
  invoices: Invoice[]
  employeePayables: EmployeePayable[]
  userName: string
}

class InvoiceAndPaymentsService {
  async getInvoicesByUserId(userId: string): Promise<InvoicesByUserIdResult> {
    const [invoices, employeePayables, name] = await Promise.all([
      invoiceService.getInvoicesByUserId(userId),
      employeePayableService.getPayablesByUserId(userId),
      usersService.getUserFirstAndLastName(userId)
    ])

    return {
      invoices,
      employeePayables: employeePayables as EmployeePayable[],
      userName: `${name.firstName} ${name.lastName}`.trim()
    }
  }

  async getInvoiceHistory(userId: string, enrollmentId: string): Promise<InvoiceHistory> {
    return clientHandler.getInvoiceHistory(userId, enrollmentId)
  }

  async getInvoiceDetails(
    invoiceId: string,
    userId: string,
    enrollmentId: string
  ): Promise<InvoiceDetails> {
    return clientHandler.getInvoiceDetails(invoiceId, userId, enrollmentId)
  }

  async applyPaymentToInvoice(
    invoiceId: string,
    userId: string,
    enrollmentId: string,
    amount: number,
    paymentType: PaymentType
  ): Promise<InvoiceDetails> {
    return clientHandler.applyPaymentToInvoice(
      invoiceId,
      userId,
      enrollmentId,
      amount,
      paymentType
    )
  }

  async getPayableDetails(userId: string, payableId: string): Promise<EmployeePayable | null> {
    return employeePayableService.getPayableDetailsWithComputedAmounts(userId, payableId)
  }
}

const invoiceAndPaymentsService = new InvoiceAndPaymentsService()
export { invoiceAndPaymentsService, InvoiceAndPaymentsService }
