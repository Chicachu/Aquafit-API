import { ClassService, classService } from "../services/ClassService"
import { enrollmentService, EnrollmentService } from "../services/EnrollmentService"
import { invoiceService, InvoiceService } from "../services/InvoiceService"
import AppError from "../types/AppError"
import { Class } from "../types/Class"
import { Discount } from "../types/discounts/Discount"
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
          days: (enrollment.daysOfWeekOverride && enrollment.daysOfWeekOverride.length > 0) ? enrollment.daysOfWeekOverride : classDoc.days
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
    discount?: Discount,
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
      await this._generateInvoice(userId, enrollment._id, classDoc, startDate, billingFrequencyOverride!, currency)
      
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
    today.setHours(0, 0, 0, 0) // Normalize to start of day

    logger.info(this._FILE_NAME, this.processDueDateCheckAndCreateInvoices.name, `Processing ${enrollments.length} enrollments`, {
      today: today.toISOString()
    })
  
    for (const enrollment of enrollments) {
      try {
        if (enrollment.cancelDate) {
          if (enrollment.autoEnrollment) {
            logger.info(this._FILE_NAME, this.processDueDateCheckAndCreateInvoices.name, 'Enrollment cancelled, disabling autoEnrollment', {
              enrollmentId: enrollment._id,
              cancelDate: enrollment.cancelDate
            })
            await this._enrollmentService.updateAutoEnrollment(enrollment._id, false)
          }
          continue
        }

        if (!enrollment.autoEnrollment) {
          continue
        }
  
        const classDoc = await this._classService.getClass(enrollment.classId)
        
        if (classDoc.endDate) {
          const classEndDate = new Date(classDoc.endDate)
          classEndDate.setHours(0, 0, 0, 0)
          if (classEndDate < today) {
            logger.debugInside(this._FILE_NAME, this.processDueDateCheckAndCreateInvoices.name, {
              message: 'Class has ended, skipping enrollment',
              enrollmentId: enrollment._id,
              classId: classDoc._id,
              classEndDate: classDoc.endDate
            })
            continue
          }
        }

        // Get the weekdays for this enrollment (needed to calculate next session day)
        const weekdays = (enrollment.daysOfWeekOverride && enrollment.daysOfWeekOverride.length > 0) 
          ? enrollment.daysOfWeekOverride 
          : classDoc.days

        let invoiceStartDate: Date
        const invoices = await this._invoiceService.getInvoicesFromIds(enrollment.invoiceIds)
        
        if (!invoices || invoices.length === 0) {
          // No invoices exist, start from enrollment startDate
          invoiceStartDate = new Date(enrollment.startDate)
          invoiceStartDate.setHours(0, 0, 0, 0)
        } else {
          // Start from the next session day after the latest invoice's end date
          const latestInvoice = invoices[0]
          const latestInvoiceEndDate = new Date(latestInvoice.period.endDate)
          latestInvoiceEndDate.setHours(0, 0, 0, 0)
          invoiceStartDate = this._getNextSessionDay(latestInvoiceEndDate, weekdays)
          invoiceStartDate.setHours(0, 0, 0, 0)
        }

        // Don't create invoices if we're already up to date
        if (invoiceStartDate >= today) {
          logger.debugInside(this._FILE_NAME, this.processDueDateCheckAndCreateInvoices.name, {
            message: 'Already up to date, skipping',
            enrollmentId: enrollment._id,
            invoiceStartDate: invoiceStartDate.toISOString(),
            today: today.toISOString()
          })
          continue
        }

        // Determine effective end date (class endDate or today, whichever is earlier)
        let effectiveEndDate = today
        if (classDoc.endDate) {
          const classEndDate = new Date(classDoc.endDate)
          classEndDate.setHours(0, 0, 0, 0)
          if (classEndDate < today) {
            effectiveEndDate = classEndDate
          }
        }

        // Calculate all missing billing periods
        const billingFrequency = enrollment.billingFrequencyOverride || classDoc.billingFrequency
        const missingPeriods = this._calculateMissingPeriods(invoiceStartDate, effectiveEndDate, billingFrequency, weekdays)

        if (missingPeriods.length === 0) {
          logger.debugInside(this._FILE_NAME, this.processDueDateCheckAndCreateInvoices.name, {
            message: 'No missing periods found',
            enrollmentId: enrollment._id,
            invoiceStartDate: invoiceStartDate.toISOString(),
            effectiveEndDate: effectiveEndDate.toISOString(),
            billingFrequency
          })
          continue
        }

        logger.info(this._FILE_NAME, this.processDueDateCheckAndCreateInvoices.name, 'Creating invoices for missing periods', {
          enrollmentId: enrollment._id,
          userId: enrollment.userId,
          missingPeriodsCount: missingPeriods.length,
          invoiceStartDate: invoiceStartDate.toISOString(),
          effectiveEndDate: effectiveEndDate.toISOString()
        })

        // Get bonus sessions (already calculated from cancellations)
        const totalBonusSessions = enrollment.bonusSessions || 0
        let remainingBonusSessions = totalBonusSessions

        // Create invoices for each missing period
        for (const period of missingPeriods) {
          // Calculate base end date for this period
          let periodEndDate = this._calculateDueDate(period.startDate, billingFrequency)
          periodEndDate.setHours(0, 0, 0, 0) // Normalize to start of day
          
          // Apply bonus sessions to this period (one session day per bonus session)
          // Note: When backfilling, we apply available bonus sessions to periods as we create them
          // In normal operation, bonus sessions would be applied at the time of cancellation
          if (remainingBonusSessions > 0) {
            // Apply one bonus session to this period (extend by one session day)
            periodEndDate = this._getNextSessionDay(periodEndDate, weekdays)
            periodEndDate.setHours(0, 0, 0, 0) // Normalize after extending
            remainingBonusSessions--
          }

          // Ensure we don't extend beyond the effective end date
          const finalEndDate = periodEndDate > effectiveEndDate ? new Date(effectiveEndDate) : periodEndDate

          await this._generateInvoiceWithEndDate(
            enrollment.userId,
            enrollment._id,
            classDoc,
            period.startDate,
            finalEndDate,
            enrollment.billingFrequencyOverride
          )

          logger.debugInside(this._FILE_NAME, this.processDueDateCheckAndCreateInvoices.name, {
            message: 'Created invoice for period',
            enrollmentId: enrollment._id,
            periodStart: period.startDate.toISOString(),
            periodEnd: finalEndDate.toISOString(),
            bonusSessionsApplied: totalBonusSessions - remainingBonusSessions,
            remainingBonusSessions: remainingBonusSessions,
            weekdays: weekdays,
            classSchedule: `${weekdays.length} days per week`
          })
        }
      } catch (error: any) {
        logger.error(`Error processing enrollment ${enrollment._id}: ${error?.message || error}`)
        // Continue processing other enrollments even if one fails
      }
    }
  
    logger.debugComplete(this._FILE_NAME, this.processDueDateCheckAndCreateInvoices.name)
  }

  private async _generateInvoice(
    userId: string, 
    enrollmentId: string, 
    classDoc: Class,
    startDate: Date, 
    billingFrequencyOverride: BillingFrequency,
    currency?: Currency
  ): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this._generateInvoice.name, { userId, enrollmentId })

    const basePrice = classDoc.prices.find(p => currency ? p.currency === currency : p.currency === Currency.PESOS)
    if (!basePrice) {
      throw new AppError('errors.missingParameters', 400)
    }

    // apply promos or discounts (change basePrice below)

    // create invoice 
    const billingFrequency = billingFrequencyOverride ? billingFrequencyOverride : classDoc.billingFrequency
    const dueDate = this._calculateDueDate(startDate, billingFrequency)
    const invoice = await this._invoiceService.createInvoice(userId, enrollmentId, basePrice, new Date(startDate), dueDate)
    // const invoice = await this._generateInvoice(userId, enrollment._id, basePrice, startDate, billingFrequency)
    await this._enrollmentService.addInvoice(enrollmentId, invoice._id)
    
    return invoice
  }

  private async _generateInvoiceWithEndDate(
    userId: string, 
    enrollmentId: string, 
    classDoc: Class,
    startDate: Date,
    endDate: Date,
    billingFrequencyOverride: BillingFrequency,
    currency?: Currency
  ): Promise<Invoice> {
    logger.debugInside(this._FILE_NAME, this._generateInvoiceWithEndDate.name, { userId, enrollmentId, startDate, endDate })

    const basePrice = classDoc.prices.find(p => currency ? p.currency === currency : p.currency === Currency.PESOS)
    if (!basePrice) {
      throw new AppError('errors.missingParameters', 400)
    }

    // apply promos or discounts (change basePrice below)

    // create invoice with calculated endDate
    const invoice = await this._invoiceService.createInvoice(userId, enrollmentId, basePrice, new Date(startDate), new Date(endDate))
    await this._enrollmentService.addInvoice(enrollmentId, invoice._id)
    
    return invoice
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

  /**
   * Counts the number of occurrences of specific weekdays within a date range
   */
  private _countWeekdaysInPeriod(startDate: Date, endDate: Date, weekdays: Weekday[]): number {
    let count = 0
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay()
      if (weekdays.includes(dayOfWeek)) {
        count++
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return count
  }

  /**
   * Finds the next session day (based on weekdays) after a given date
   */
  private _getNextSessionDay(date: Date, weekdays: Weekday[]): Date {
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + 1)
    
    // Find the next day that matches one of the session weekdays
    let attempts = 0
    while (attempts < 7) {
      const dayOfWeek = nextDate.getDay()
      if (weekdays.includes(dayOfWeek)) {
        return nextDate
      }
      nextDate.setDate(nextDate.getDate() + 1)
      attempts++
    }
    
    // Fallback: return date + 1 day if no match found (shouldn't happen)
    return nextDate
  }

  /**
   * Calculates the end date for an invoice period, extending it by bonus sessions
   */
  private _calculatePeriodEndDateWithBonusSessions(
    startDate: Date,
    billingFrequency: BillingFrequency,
    weekdays: Weekday[],
    bonusSessions: number
  ): Date {
    // Calculate base end date
    let endDate = this._calculateDueDate(startDate, billingFrequency)
    
    // Extend end date by bonus sessions (one session day per bonus session)
    for (let i = 0; i < bonusSessions; i++) {
      endDate = this._getNextSessionDay(endDate, weekdays)
    }
    
    return endDate
  }

  /**
   * Calculates all missing billing periods between a start date and end date
   * Each period starts on a session day, and the next period starts on the next session day after the previous period's end date
   */
  private _calculateMissingPeriods(
    startDate: Date,
    endDate: Date,
    billingFrequency: BillingFrequency,
    weekdays: Weekday[]
  ): { startDate: Date; endDate: Date }[] {
    const periods: { startDate: Date; endDate: Date }[] = []
    let currentStart = new Date(startDate)
    
    while (currentStart < endDate) {
      const periodEnd = this._calculateDueDate(currentStart, billingFrequency)
      
      // Don't create periods that extend beyond the end date
      const actualEnd = periodEnd > endDate ? new Date(endDate) : periodEnd
      
      periods.push({
        startDate: new Date(currentStart),
        endDate: actualEnd
      })
      
      // Move to next period - start from the next session day after this period's end date
      const nextPeriodStart = this._getNextSessionDay(actualEnd, weekdays)
      currentStart = new Date(nextPeriodStart)
    }
    
    return periods
  }

}

const clientHandler = new ClientHandler(enrollmentService, classService, invoiceService, usersService)
export { clientHandler, ClientHandler }