import { ClassService, classService } from "../services/ClassService"
import { enrollmentService, EnrollmentService } from "../services/EnrollmentService"
import { invoiceService, InvoiceService } from "../services/InvoiceService"
import AppError from "../types/AppError"
import { Class } from "../types/Class"
import { Promotion } from "../types/discounts/Promotion"
import { Enrollment, EnrollmentCreationDTO } from "../types/Enrollment"
import { BillingFrequency } from "../types/enums/BillingFrequency"
import { Currency } from "../types/enums/Currency"
import { Invoice } from "../types/Invoice"
import { Price } from "../types/Price"

class ClientHandler {
  constructor(private _enrollmentService: EnrollmentService, private _classService: ClassService, private _invoiceService: InvoiceService) {}
  async enrollClient(
    classId: string, 
    userId: string, 
    startDate: Date, 
    billingFrequency?: BillingFrequency, 
    promotion?: Promotion,
    currency?: Currency
  ): Promise<void> {
    if (!classId || !userId || !billingFrequency) {
      throw new AppError(i18n.__('errors.missingParameters'), 400)
    }

    const existingEnrollment = await this._enrollmentService.getEnrollment(classId, userId)

    if (existingEnrollment) throw new AppError(i18n.__('errors.enrollmentAlreadyExists'), 400)

    const classDoc = await this._classService.getClass(classId)
    let enrollment = await this._enrollClient(classDoc, userId, startDate, billingFrequency)
    

    const basePrice = classDoc.prices.find(p => currency ? p.currency === currency : p.currency === Currency.PESOS)
    if (!basePrice) {
      throw new AppError(i18n.__('errors.missingParameters'), 400)
    }

    // apply promos or discounts (change basePrice below)

    // create invoice 
    const invoice = await this._generateInvoice(userId, enrollment._id, basePrice, startDate, billingFrequency)
    enrollment = await this._enrollmentService.addInvoice(enrollment._id, invoice._id)
  }

  private async _generateInvoice(
    userId: string, 
    enrollmentId: string, 
    price: Price, 
    startDate: Date, 
    billingFrequency: BillingFrequency
  ): Promise<Invoice> {
    const dueDate = this._calculateDueDate(startDate, billingFrequency)
    return await this._invoiceService.createInvoice(userId, enrollmentId, price, new Date(startDate), dueDate)
  }

  private async _enrollClient(classDoc: Class, userId: string, startDate: Date, billingFrequency?: BillingFrequency): Promise<Enrollment> {
    const enrollmentDTO: EnrollmentCreationDTO = {
      userId, 
      classId: classDoc._id, 
      startDate, 
      billingFrequency: billingFrequency ?? classDoc.billingFrequency
    }
    
    return await this._enrollmentService.enrollClient(enrollmentDTO)
  }

  private _calculateDueDate(startDate: Date, billingFrequency: BillingFrequency): Date {
    const dueDate = new Date(startDate)

    switch (billingFrequency) {
      case BillingFrequency.MONTHLY: 
        dueDate.setDate(dueDate.getDate() + 28)
        break
      case BillingFrequency.WEEKLY: 
        dueDate.setDate(dueDate.getDate() + 7)
        break
      case BillingFrequency.ONE_TIME: 
        default: 
        break
    }

    return dueDate
  }
}

const clientHandler = new ClientHandler(enrollmentService, classService, invoiceService)
export { clientHandler, ClientHandler }