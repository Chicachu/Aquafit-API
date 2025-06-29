import { ClassService, classService } from "../services/ClassService"
import { enrollmentService, EnrollmentService } from "../services/EnrollmentService"
import { invoiceService, InvoiceService } from "../services/InvoiceService"
import AppError from "../types/AppError"
import { Class } from "../types/Class"
import { Promotion } from "../types/discounts/Promotion"
import { Enrollment, EnrollmentCreationDTO } from "../types/Enrollment"
import { BillingFrequency } from "../types/enums/BillingFrequency"
import { Currency } from "../types/enums/Currency"
import { Invoice } from "../types/invoices/Invoice"
import { Price } from "../types/Price"
import mongoose from 'mongoose'
import { ClientEnrollmentDetails } from "../types/ClientEnrollmentDetails"
import { usersService, UsersService } from "../services/UsersService"
import { Weekday } from "../types/enums/Weekday"
import { logger } from "../services/LoggingService"
import path from "path"
import { InvoiceHistory } from "../types/invoices/InvoiceHistory"
import { InvoiceDetails } from "../types/invoices/InvoiceDetails"

class ClientHandler {
  constructor(
    private _enrollmentService: EnrollmentService, 
    private _classService: ClassService, 
    private _invoiceService: InvoiceService,
    private _userService: UsersService
  ) {}

  private readonly _FILE_NAME = path.basename(__filename)

  async getInvoiceDetails(invoiceId: string, userId: string, enrollmentId: string): Promise<InvoiceDetails> {
    if (!invoiceId || !userId) {
      throw new AppError('errors.missingParameters', 400)
    }

    logger.debugInside(this._FILE_NAME, this.getInvoiceDetails.name, { invoiceId })
    try {
      const invoice = await this._invoiceService.getInvoice(invoiceId)
      const clientName = await this._userService.getUserFirstAndLastName(userId)
      const enrollment = await this._enrollmentService.getEnrollmentById(enrollmentId)
      const classDoc = await this._classService.getClass(enrollment.classId)

      const invoiceDetails: InvoiceDetails = {
        clientName: `${clientName.firstName} ${clientName.lastName}`, 
        classDetails: {
          classType: classDoc.classType,
          classLocation: classDoc.classLocation,
          days: (enrollment.daysOfWeekOverride && enrollment.daysOfWeekOverride.length > 0) ? enrollment.daysOfWeekOverride : classDoc.days
        },
        charge: invoice.charge, 
        paymentsApplied: [...invoice.paymentsApplied],
        paymentStatus: invoice.paymentStatus,
        period: invoice.period
      }

      logger.debugComplete(this._FILE_NAME, this.getInvoiceDetails.name)
      return invoiceDetails
    } catch (error: any) {
      throw new AppError('errors.resourceNotFound', error.status)
    }
  }

  async getInvoiceHistory(userId: string, enrollmentId: string): Promise<InvoiceHistory> {
    if (!userId || !enrollmentId) {
      throw new AppError('errors.missingParameters', 400)
    }

    logger.debugInside(this._FILE_NAME, this.getInvoiceHistory.name, { userId, enrollmentId })
    try {
      const invoices = await this._invoiceService.getClientEnrollmentHistory(userId, enrollmentId)
      const clientName = await this._userService.getUserFirstAndLastName(userId)

      const enrollment = await this._enrollmentService.getEnrollmentById(enrollmentId)
      const classDoc = await this._classService.getClass(enrollment.classId)

      const invoiceHistory = {
        invoices, 
        clientName: `${clientName.firstName} ${clientName.lastName}` , 
        classDetails: {
          classType: classDoc.classType, 
          classLocation: classDoc.classLocation,
          days: enrollment.daysOfWeekOverride ?? classDoc.days
        }
      }

      logger.debugComplete(this._FILE_NAME, this.getInvoiceHistory.name)
      return invoiceHistory
    } catch (error: any) {
      throw new AppError(error.message, error.status)
    }
  }

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
      const enrollmentRatio = enrollment.daysOfWeekOverride ? (enrollment.daysOfWeekOverride.length / classDoc.days.length) : 1

      const invoice = await this._generateInvoice(userId, enrollment._id, basePrice, startDate, billingFrequency, enrollmentRatio)
      enrollment = await this._enrollmentService.addInvoice(enrollment._id, invoice._id)
      await session.commitTransaction()
    } catch (error: any) {
      await session.abortTransaction()
      throw new AppError(error.message, error.status)
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

  async processDueDateCheckAndCreateInvoices(): Promise<void> {
    logger.debugInside(this._FILE_NAME, this.processDueDateCheckAndCreateInvoices.name)
  
    const enrollments = await this._enrollmentService.getAllEnrollments()
    const today = new Date()
  
    for (const enrollment of enrollments) {
      try {
        if (!enrollment.autoEnrollment) {
          continue
        }
  
        // Get invoices for this enrollment, sorted by dueDate descending (latest first)
        const invoices = await this._invoiceService.getInvoicesFromIds(enrollment.invoiceIds)
        if (!invoices || invoices.length === 0) {
          // Optional: maybe create the first invoice if none exist
          continue
        }
  
        const latestInvoice = invoices[0]
  
        // If the dueDate has passed, create a new invoice
        if (latestInvoice.period.dueDate < today) {
          logger.info(this._FILE_NAME, this.processDueDateCheckAndCreateInvoices.name, 'Due date passed, generating new invoice', {
            enrollmentId: enrollment._id,
            userId: enrollment.userId,
            latestInvoiceDueDate: latestInvoice.period.dueDate,
          })
  
          const classDoc = await this._classService.getClass(enrollment.classId)
          const basePrice = classDoc.prices.find(p => p.currency === Currency.PESOS)
          if (!basePrice) {
            throw new AppError('errors.noBasePriceInClass', 400)
          }
  
          const billingFrequency = enrollment.billingFrequencyOverride ?? classDoc.billingFrequency
          const overrideDays = enrollment.daysOfWeekOverride
          const enrollmentRatio = (overrideDays && overrideDays.length > 0) ? (overrideDays.length / classDoc.days.length) : 1
          // Generate new invoice starting from today
          const newInvoice = await this._generateInvoice(
            enrollment.userId,
            enrollment._id,
            basePrice,
            new Date(latestInvoice.period.dueDate),
            billingFrequency,
            enrollmentRatio
          )
  
          // Link new invoice to enrollment
          await this._enrollmentService.addInvoice(enrollment._id, newInvoice._id)
          logger.debugComplete(this._FILE_NAME, this.processDueDateCheckAndCreateInvoices.name, { newInvoiceId: newInvoice._id })
        }
      } catch (error: any) {
        throw new AppError('errors.unableToCreateResource', 400)
      }
    }
  
    logger.debugComplete(this._FILE_NAME, this.processDueDateCheckAndCreateInvoices.name)
  }

  private async _generateInvoice(
    userId: string, 
    enrollmentId: string, 
    price: Price, 
    startDate: Date, 
    billingFrequency: BillingFrequency,
    partialEnrollmentRatio: number
  ): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this._generateInvoice.name, { userId, enrollmentId })
    const dueDate = this._calculateDueDate(startDate, billingFrequency)
    const newPrice = {
      amount: partialEnrollmentRatio ? Math.round((price.amount * partialEnrollmentRatio)) : price.amount,
      currency: price.currency
    }
    return await this._invoiceService.createInvoice(userId, enrollmentId, newPrice, new Date(startDate), dueDate)
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
      daysOfWeekOverride: daysOverride ?? undefined,
      autoEnrollment: true
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