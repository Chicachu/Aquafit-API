import path from "path"
import { ClassService, classService } from "../services/ClassService"
import { EnrollmentService, enrollmentService } from "../services/EnrollmentService"
import { invoiceService, InvoiceService } from "../services/InvoiceService"
import { logger } from "../services/LoggingService"
import AppError from "../types/AppError"
import { ClassDetails } from "../types/ClassDetails"
import { Enrollment } from "../types/Enrollment"
import { Weekday } from "../types/enums/Weekday"
import { usersService, UsersService } from "../services/UsersService"
import { ClassClientEnrollmentDetails } from "../types/ClassClientEnrollmentDetails"
import { PaymentStatus } from "../types/enums/PaymentStatus"
import { AppliedDiscount } from "../types/discounts/AppliedDiscount"
import { Currency } from "../types/enums/Currency"

class ClassHandler {
  constructor(
    private classService: ClassService, 
    private enrollmentService: EnrollmentService,
    private invoiceService: InvoiceService,
    private userService: UsersService
  ) {}

  private readonly _FILE_NAME = path.basename(__filename)

  async getClassDetails(classId: string): Promise<ClassDetails> {
    logger.debugInside(this._FILE_NAME, this.getClassDetails.name, { classId })
    const foundClass = await this.classService.getClass(classId)
    if (!foundClass) {
      throw new AppError('errors.resourceNotFound', 404)
    }

    const classEnrollments = await this.enrollmentService.getClassEnrollmentInfo(foundClass._id!)
    
    const clientEnrollmentDetails = await this._getClientEnrollmentDetails(classEnrollments)
    const classDetails: ClassDetails = {
      ...foundClass, 
      clients: clientEnrollmentDetails,
      enrollmentCounts: this._getEnrollmentCounts(classEnrollments, foundClass.days)
    }

    logger.debugComplete(this._FILE_NAME, this.getClassDetails.name)
    return classDetails
  }

  private async _getClientEnrollmentDetails(classEnrollments: Enrollment[]): Promise<ClassClientEnrollmentDetails[]> {
    const classClientEnrollmentDetails: ClassClientEnrollmentDetails[] = []
  
    for (const classEnrollment of classEnrollments) {
      const firstAndLast = await this.userService.getUserFirstAndLastName(classEnrollment.userId)
      const currentPayment = await this.invoiceService.getOldestUnpaidInvoice(classEnrollment.invoiceIds)
      classClientEnrollmentDetails.push({
        _id: firstAndLast._id,
        firstName: firstAndLast.firstName,
        lastName: firstAndLast.lastName,
        currentPayment
      })
    }
  
    return classClientEnrollmentDetails
  }

  private _getEnrollmentCounts(enrollments: Enrollment[], classDays: Weekday[]): Partial<Record<Weekday, number>> {
    const enrollmentCounts: Partial<Record<Weekday, number>> = Object.fromEntries(
      classDays.map(day => [day, 0])
    )
    enrollments.forEach((enrollment) => {
      if (enrollment.daysOfWeekOverride && enrollment.daysOfWeekOverride.length > 0) {
        for (const day of enrollment.daysOfWeekOverride) {
          if (enrollmentCounts[day] !== undefined) enrollmentCounts[day] += 1
        }
      } else {
        for (const day of classDays) enrollmentCounts[day]! += 1
      }
    })

    return enrollmentCounts
  }

  async terminateClass(classId: string, endDate: Date): Promise<void> {
    logger.debugInside(this._FILE_NAME, this.terminateClass.name, { classId, endDate })
    
    const foundClass = await this.classService.getClass(classId)
    if (!foundClass) {
      throw new AppError('errors.resourceNotFound', 404)
    }

    // Normalize the termination date (set to midnight)
    const terminationDate = new Date(endDate)
    terminationDate.setHours(0, 0, 0, 0)
    
    // Update class endDate to the selected termination date
    await this.classService.updateClassInfo(foundClass, { endDate: terminationDate })

    // Get all enrollments for this class
    const classEnrollments = await this.enrollmentService.getClassEnrollmentInfo(classId)
    
    // Get class days (use enrollment override if exists, otherwise use class days)
    const classDays = foundClass.days

    // Process each enrollment
    for (const enrollment of classEnrollments) {
      try {
        // Get the current invoice (oldest unpaid, or most recent if all paid)
        let currentInvoice
        try {
          currentInvoice = await this.invoiceService.getOldestUnpaidInvoice(enrollment.invoiceIds)
        } catch (error) {
          // If no unpaid invoice, get the most recent one
          currentInvoice = await this.invoiceService.getCurrentInvoice(enrollment.invoiceIds)
        }

        if (!currentInvoice) continue

        // Determine effective weekdays for this enrollment
        const effectiveWeekdays = enrollment.daysOfWeekOverride && enrollment.daysOfWeekOverride.length > 0
          ? enrollment.daysOfWeekOverride
          : classDays

        // Calculate remaining sessions from termination date to invoice endDate
        const invoiceEndDate = new Date(currentInvoice.period.endDate)
        invoiceEndDate.setHours(0, 0, 0, 0)
        
        const remainingSessions = this._countWeekdaysInPeriod(terminationDate, invoiceEndDate, effectiveWeekdays)

        if (remainingSessions <= 0) continue

        // Calculate price per session
        // Get the price for the invoice currency
        const invoiceCurrency = currentInvoice.charge.currency
        const classPrice = foundClass.prices.find(p => p.currency === invoiceCurrency)
        if (!classPrice) continue

        // Calculate total sessions in the invoice period
        const totalSessions = this._countWeekdaysInPeriod(
          new Date(currentInvoice.period.startDate),
          invoiceEndDate,
          effectiveWeekdays
        )

        if (totalSessions === 0) continue

        // Get user to check current credits
        const user = await this.userService.getUserById(enrollment.userId)

        // Calculate the base amount to use for refund calculation
        // For paid invoices: use amount actually paid (charge - remainingBalance) to handle partial payments
        // For unpaid invoices: use charge amount (what they owe)
        const baseAmount = currentInvoice.paymentStatus === PaymentStatus.PAID
          ? currentInvoice.charge.amount - currentInvoice.remainingBalance
          : currentInvoice.charge.amount

        // Calculate price per session based on actual amount (after discounts and payments)
        // This ensures we refund based on what the client actually owes/paid, not the original amount
        const pricePerSession = baseAmount / totalSessions

        // Calculate refund amount
        const refundAmount = pricePerSession * remainingSessions

        if (currentInvoice.paymentStatus === PaymentStatus.PAID) {
          // Invoice is paid - add to credits
          const currentCredits = user.credits || { amount: 0, currency: invoiceCurrency }
          
          // If credits exist in different currency, we'll use the invoice currency
          const newCreditsAmount = (currentCredits.currency === invoiceCurrency 
            ? currentCredits.amount 
            : 0) + refundAmount

          await this.userService.updateUserInfo(user, {
            credits: {
              amount: newCreditsAmount,
              currency: invoiceCurrency
            }
          })

          logger.debugInside(this._FILE_NAME, this.terminateClass.name, {
            userId: enrollment.userId,
            action: 'credits_added',
            amount: refundAmount,
            currency: invoiceCurrency,
            remainingSessions
          })
        } else {
          // Invoice not paid - apply discount to reduce amount due
          const newChargeAmount = Math.max(0, currentInvoice.charge.amount - refundAmount)
          const newAmountDue = Math.max(0, currentInvoice.amountDue - refundAmount)
          const newRemainingBalance = Math.max(0, currentInvoice.remainingBalance - refundAmount)

          // Create a termination discount entry
          const terminationDiscount: AppliedDiscount = {
            discountId: 'class-termination',
            amountOverride: {
              amount: refundAmount,
              currency: invoiceCurrency
            },
            amountSnapshot: {
              amount: refundAmount,
              currency: invoiceCurrency
            },
            description: `Class termination refund for ${remainingSessions} remaining session(s)`
          }

          const updatedDiscounts = [...(currentInvoice.discountsApplied || []), terminationDiscount]

          // Update invoice charge with discounts
          await this.invoiceService.updateInvoiceCharge(
            currentInvoice._id!,
            currentInvoice.originalPrice,
            {
              amount: newChargeAmount,
              currency: invoiceCurrency
            },
            updatedDiscounts
          )

          // Update amountDue and remainingBalance separately (they may differ from charge due to payments)
          await this.invoiceService.updateInvoiceAmounts(
            currentInvoice._id!,
            newAmountDue,
            newRemainingBalance
          )

          logger.debugInside(this._FILE_NAME, this.terminateClass.name, {
            userId: enrollment.userId,
            action: 'discount_applied',
            amount: refundAmount,
            currency: invoiceCurrency,
            remainingSessions
          })
        }
      } catch (error: any) {
        logger.debugInside(this._FILE_NAME, this.terminateClass.name, {
          error: error.message,
          enrollmentId: enrollment._id,
          userId: enrollment.userId
        })
        // Continue processing other enrollments even if one fails
      }
    }

    logger.debugComplete(this._FILE_NAME, this.terminateClass.name)
  }

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
}
const classHandler = new ClassHandler(classService, enrollmentService, invoiceService, usersService)
export { classHandler, ClassHandler }