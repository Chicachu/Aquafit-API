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
import mongoose from 'mongoose'
import { ClientEnrollmentDetails } from "../types/ClientEnrollmentDetails"
import { usersService, UsersService } from "../services/UsersService"
import { Weekday } from "../types/enums/Weekday"
import { logger } from "../services/LoggingService"
import path from "path"

class ClientHandler {
  constructor(
    private _enrollmentService: EnrollmentService, 
    private _classService: ClassService, 
    private _invoiceService: InvoiceService,
    private _userService: UsersService
  ) {}

  private readonly _FILE_NAME = path.basename(__filename)

  async enrollClient(
    classId: string, 
    userId: string, 
    startDate: Date, 
    billingFrequencyOverride?: BillingFrequency, 
    daysOverride?: Weekday[],
    promotion?: Promotion,
    currency?: Currency
  ): Promise<void> {
    if (!classId || !userId) {
      throw new AppError('errors.missingParameters', 400)
    }
    logger.debugInside(this._FILE_NAME, this.enrollClient.name, { classId, userId })

    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      const existingEnrollment = await this._enrollmentService.getEnrollment(classId, userId)

      if (existingEnrollment) throw new AppError('errors.enrollmentAlreadyExists', 400)

      const classDoc = await this._classService.getClass(classId)
      let enrollment = await this._enrollClient(classDoc, userId, startDate, billingFrequencyOverride, daysOverride)
      
      const basePrice = classDoc.prices.find(p => currency ? p.currency === currency : p.currency === Currency.PESOS)
      if (!basePrice) {
        throw new AppError('errors.missingParameters', 400)
      }

      // apply promos or discounts (change basePrice below)

      // create invoice 
      const billingFrequency = billingFrequencyOverride ? billingFrequencyOverride : classDoc.billingFrequency
      const invoice = await this._generateInvoice(userId, enrollment._id, basePrice, startDate, billingFrequency)
      enrollment = await this._enrollmentService.addInvoice(enrollment._id, invoice._id)
      await session.commitTransaction()
    } catch (error: any) {
      await session.abortTransaction()
      throw new AppError(error.message, 500)
    } finally {
      logger.debugComplete(this._FILE_NAME, this.enrollClient.name)
      session.endSession()
    }
  }

  async getClientEnrollmentDetails(userId: string): Promise<ClientEnrollmentDetails> {
    logger.debugInside(this._FILE_NAME, this.getClientEnrollmentDetails.name, { userId })
    const clientEnrollments = await this._enrollmentService.getClientEnrollments(userId)
    const client = await this._userService.getUserById(userId)
    const enrolledClassInfo: { class: Class, enrollment: Enrollment }[] = []
    for (const enrollment of clientEnrollments) {
      const classInfo = await this._classService.getClass(enrollment.classId)
      enrolledClassInfo.push({ class: classInfo, enrollment })
    }

    const clientEnrollmentDetails: ClientEnrollmentDetails = {
      client, 
      enrolledClassInfo
    }

    logger.debugComplete(this._FILE_NAME, this.getClientEnrollmentDetails.name)
    return clientEnrollmentDetails
  }

  private async _generateInvoice(
    userId: string, 
    enrollmentId: string, 
    price: Price, 
    startDate: Date, 
    billingFrequency: BillingFrequency
  ): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this._generateInvoice.name, { userId, enrollmentId })
    const dueDate = this._calculateDueDate(startDate, billingFrequency)
    return await this._invoiceService.createInvoice(userId, enrollmentId, price, new Date(startDate), dueDate)
  }

  private async _enrollClient(
    classDoc: Class, 
    userId: string, 
    startDate: Date, 
    billingFrequencyOverride?: BillingFrequency, 
    daysOverride?: Weekday[]
  ): Promise<Enrollment> {
    logger.debugInside(this._FILE_NAME, this._enrollClient.name, { userId })
    const enrollmentDTO: EnrollmentCreationDTO = {
      userId, 
      classId: classDoc._id, 
      startDate, 
      billingFrequencyOverride: billingFrequencyOverride ?? undefined,
      daysOfWeekOverride: daysOverride ?? undefined
    }
    
    return await this._enrollmentService.enrollClient(enrollmentDTO)
  }

  private _calculateDueDate(startDate: Date, billingFrequency: BillingFrequency): Date {
    logger.debugInside(this._FILE_NAME, this._calculateDueDate.name)
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

const clientHandler = new ClientHandler(enrollmentService, classService, invoiceService, usersService)
export { clientHandler, ClientHandler }