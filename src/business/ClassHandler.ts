import path from "path"
import { ClassService, classService } from "../services/ClassService"
import { EnrollmentService, enrollmentService } from "../services/EnrollmentService"
import { ClassStatus } from "../types/enums/ClassStatus"
import { invoiceService, InvoiceService } from "../services/InvoiceService"
import { logger } from "../services/LoggingService"
import { countWeekdaysInPeriod, getNextSessionDay } from "../services/dateUtils"
import AppError from "../types/AppError"
import { ClassDetails } from "../types/ClassDetails"
import { Enrollment } from "../types/Enrollment"
import { Weekday } from "../types/enums/Weekday"
import { usersService, UsersService } from "../services/UsersService"
import { ClassClientEnrollmentDetails } from "../types/ClassClientEnrollmentDetails"
import { PaymentStatus } from "../types/enums/PaymentStatus"
import { AppliedDiscount } from "../types/discounts/AppliedDiscount"
import { Invoice } from "../types/invoices/Invoice"
import { ClassType } from "../types/enums/ClassType"
import { EnrollmentStatus } from "../types/enums/EnrollmentStatus"

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
    const activeEnrollments = classEnrollments.filter((enrollment) => this._isActiveEnrollment(enrollment))

    const clientEnrollmentDetails = await this._getClientEnrollmentDetails(activeEnrollments, foundClass.days)
    const classDetails: ClassDetails = {
      ...foundClass, 
      clients: clientEnrollmentDetails,
      enrollmentCounts: this._getEnrollmentCounts(activeEnrollments, foundClass.days)
    }

    logger.debugComplete(this._FILE_NAME, this.getClassDetails.name)
    return classDetails
  }

  private async _getClientEnrollmentDetails(
    classEnrollments: Enrollment[],
    classDays: Weekday[]
  ): Promise<ClassClientEnrollmentDetails[]> {
    const classClientEnrollmentDetails: ClassClientEnrollmentDetails[] = []

    for (const classEnrollment of classEnrollments) {
      try {
        const firstAndLast = await this.userService.getUserFirstAndLastName(classEnrollment.userId)
        const currentPayment = await this._getCurrentPaymentInvoice(classEnrollment.invoiceIds)
        const isPartiallyEnrolled =
          (classEnrollment.daysOfWeekOverride?.length ?? 0) > 0 &&
          (classEnrollment.daysOfWeekOverride?.length ?? 0) < classDays.length

        classClientEnrollmentDetails.push({
          _id: firstAndLast._id,
          enrollmentId: classEnrollment._id!,
          firstName: firstAndLast.firstName,
          lastName: firstAndLast.lastName,
          currentPayment: currentPayment ?? undefined,
          isPartiallyEnrolled,
          ...(classEnrollment.daysOfWeekOverride?.length
            ? { daysOfWeekOverride: classEnrollment.daysOfWeekOverride }
            : {})
        })
      } catch (error: any) {
        logger.debugInside(this._FILE_NAME, this._getClientEnrollmentDetails.name, {
          enrollmentId: classEnrollment._id,
          userId: classEnrollment.userId,
          error: error?.message
        })
      }
    }

    return classClientEnrollmentDetails
  }

  private _isActiveEnrollment(enrollment: Enrollment): boolean {
    return !enrollment.status || enrollment.status === EnrollmentStatus.ACTIVE
  }

  private async _getCurrentPaymentInvoice(invoiceIds: string[]): Promise<Invoice | null> {
    if (!invoiceIds?.length) return null

    try {
      return await this.invoiceService.getOldestUnpaidInvoice(invoiceIds)
    } catch {
      try {
        return await this.invoiceService.getCurrentInvoice(invoiceIds)
      } catch {
        return null
      }
    }
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

    const terminationDate = new Date(endDate)
    terminationDate.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endDatePassed = terminationDate <= today

    if (!endDatePassed) {
      // Future endDate: only set endDate. Cron will update status and run refunds when it passes.
      await this.classService.updateClassInfo(foundClass, { endDate: terminationDate })
      logger.debugInside(this._FILE_NAME, this.terminateClass.name, {
        action: 'endDate_scheduled',
        terminationDate: terminationDate.toISOString()
      })
      logger.debugComplete(this._FILE_NAME, this.terminateClass.name)
      return
    }

    // endDate has passed: update endDate + status, mark enrollments terminated, run refunds
    await this.classService.updateClassInfo(foundClass, {
      endDate: terminationDate,
      status: ClassStatus.TERMINATED
    })
    await this.enrollmentService.setEnrollmentsTerminatedForClass(classId)

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
        
        const remainingSessions = countWeekdaysInPeriod(terminationDate, invoiceEndDate, effectiveWeekdays)

        if (remainingSessions <= 0) continue

        // Calculate price per session
        // Get the price for the invoice currency
        const invoiceCurrency = currentInvoice.charge.currency
        const classPrice = foundClass.prices.find(p => p.currency === invoiceCurrency)
        if (!classPrice) continue

        // Calculate total sessions in the invoice period
        const totalSessions = countWeekdaysInPeriod(
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

  async cancelClass(classId: string, cancellationDate: Date, cancelledBy?: 'instructor' | 'client', reason?: string): Promise<void> {
    const effectiveCancelledBy = cancelledBy ?? 'instructor'
    const effectiveReason = (reason && reason.trim()) ? reason.trim() : 'Class cancelled by admin'
    logger.debugInside(this._FILE_NAME, this.cancelClass.name, { classId, cancellationDate, cancelledBy: effectiveCancelledBy })

    const foundClass = await this.classService.getClass(classId)
    if (!foundClass) {
      throw new AppError('errors.resourceNotFound', 404)
    }

    // Normalize the cancellation date (set to midnight)
    const normalizedCancellationDate = new Date(cancellationDate)
    normalizedCancellationDate.setHours(0, 0, 0, 0)

    // Check if this date has already been cancelled
    if (foundClass.cancellations && foundClass.cancellations.length > 0) {
      const existingCancellation = foundClass.cancellations.find(cancellation => {
        const cancellationDateObj = new Date(cancellation.date)
        cancellationDateObj.setHours(0, 0, 0, 0)
        return cancellationDateObj.getTime() === normalizedCancellationDate.getTime()
      })

      if (existingCancellation) {
        throw new AppError('errors.classAlreadyCancelledForDate', 400)
      }
    }

    // Get all enrollments for this class
    const classEnrollments = await this.enrollmentService.getClassEnrollmentInfo(classId)

    // Get class days
    const classDays = foundClass.days
    const isPrivateFitness = foundClass.classType === ClassType.PRIVATE_FITNESS

    // Process each enrollment
    for (const enrollment of classEnrollments) {
      try {
        // Determine effective weekdays for this enrollment
        const effectiveWeekdays = enrollment.daysOfWeekOverride && enrollment.daysOfWeekOverride.length > 0
          ? enrollment.daysOfWeekOverride
          : classDays

        // Check if the cancellation date falls on a day this enrollment attends
        // If not, skip giving them a bonus session
        const cancellationDayOfWeek = normalizedCancellationDate.getDay()
        if (!effectiveWeekdays.includes(cancellationDayOfWeek)) {
          logger.debugInside(this._FILE_NAME, this.cancelClass.name, {
            userId: enrollment.userId,
            enrollmentId: enrollment._id,
            message: 'Cancellation date not in enrollment days, skipping bonus session',
            cancellationDayOfWeek,
            effectiveWeekdays
          })
          continue
        }

        // Find the invoice that contains the cancellation date in its period
        const allInvoices = await this.invoiceService.getInvoicesFromIds(enrollment.invoiceIds)
        let targetInvoice: Invoice | null = null

        for (const invoice of allInvoices) {
          const invoiceStartDate = new Date(invoice.period.startDate)
          invoiceStartDate.setHours(0, 0, 0, 0)
          const invoiceEndDate = new Date(invoice.period.endDate)
          invoiceEndDate.setHours(0, 0, 0, 0)

          // Check if cancellation date falls within this invoice's period
          if (normalizedCancellationDate >= invoiceStartDate && normalizedCancellationDate <= invoiceEndDate) {
            targetInvoice = invoice
            break
          }
        }

        if (!targetInvoice) {
          logger.debugInside(this._FILE_NAME, this.cancelClass.name, {
            enrollmentId: enrollment._id,
            userId: enrollment.userId,
            message: 'No invoice found that contains cancellation date - invoice may need to be generated first',
            cancellationDate: normalizedCancellationDate.toISOString(),
            invoiceCount: allInvoices.length
          })
          // Skip applying bonus session if no invoice contains the cancellation date
          // The invoice generation process will handle this when it runs
          continue
        }

        // Private Fitness + client-initiated: only give bonus on first client cancel per enrollment period; instructor-initiated always gets bonus
        if (isPrivateFitness && effectiveCancelledBy === 'client') {
          const invoiceStartDate = new Date(targetInvoice.period.startDate)
          invoiceStartDate.setHours(0, 0, 0, 0)
          const invoiceEndDate = new Date(targetInvoice.period.endDate)
          invoiceEndDate.setHours(0, 0, 0, 0)
          const existingClientCancellationsInPeriod = (foundClass.cancellations || []).filter(c => {
            const d = new Date(c.date)
            d.setHours(0, 0, 0, 0)
            return d >= invoiceStartDate && d <= invoiceEndDate && c.cancelledBy === 'client'
          })
          if (existingClientCancellationsInPeriod.length >= 1) {
            logger.debugInside(this._FILE_NAME, this.cancelClass.name, {
              userId: enrollment.userId,
              enrollmentId: enrollment._id,
              message: 'Private Fitness client cancel: not first in period, no bonus session',
              existingClientCancellationsInPeriod: existingClientCancellationsInPeriod.length
            })
            continue
          }
        }

        // Increment bonus sessions (total given) for this enrollment
        const currentBonusSessions = enrollment.bonusSessions || 0
        const newBonusSessions = currentBonusSessions + 1

        // Increment consumed bonus sessions (since we're immediately using it to extend current invoice)
        const currentBonusSessionsConsumed = enrollment.bonusSessionsConsumed || 0
        const newBonusSessionsConsumed = currentBonusSessionsConsumed + 1

        await this.enrollmentService.updateBonusSessions(enrollment._id!, newBonusSessions)
        await this.enrollmentService.updateBonusSessionsConsumed(enrollment._id!, newBonusSessionsConsumed)

        // Extend the invoice period end date by one session day
        const currentEndDate = new Date(targetInvoice.period.endDate)
        currentEndDate.setHours(0, 0, 0, 0)
        
        const extendedEndDate = getNextSessionDay(currentEndDate, effectiveWeekdays)
        extendedEndDate.setHours(0, 0, 0, 0)

        // Update the invoice period end date and increment bonus sessions applied
        await this.invoiceService.updateInvoicePeriodEndDate(targetInvoice._id!, extendedEndDate, true)

        logger.debugInside(this._FILE_NAME, this.cancelClass.name, {
          userId: enrollment.userId,
          enrollmentId: enrollment._id,
          action: 'bonus_session_added_and_consumed',
          bonusSessions: newBonusSessions,
          bonusSessionsConsumed: newBonusSessionsConsumed,
          invoiceId: targetInvoice._id,
          oldEndDate: currentEndDate.toISOString(),
          newEndDate: extendedEndDate.toISOString(),
          cancellationDate: normalizedCancellationDate.toISOString()
        })
      } catch (error: any) {
        logger.debugInside(this._FILE_NAME, this.cancelClass.name, {
          error: error.message,
          enrollmentId: enrollment._id,
          userId: enrollment.userId
        })
        // Continue processing other enrollments even if one fails
      }
    }

    // Add the cancellation to the class's cancellations array
    // Using a placeholder employeeId for now - will be implemented later
    const placeholderEmployeeId = 'system' // TODO: Replace with actual employeeId when implemented
    const newCancellation = {
      date: normalizedCancellationDate,
      employeeId: placeholderEmployeeId,
      reason: effectiveReason,
      cancelledBy: effectiveCancelledBy
    }
    
    // Get existing cancellations (handle both Mongoose document and plain object)
    const existingCancellations = foundClass.cancellations || []
    const updatedCancellations = [...existingCancellations, newCancellation]
    
    logger.debugInside(this._FILE_NAME, this.cancelClass.name, {
      message: 'Adding cancellation to class',
      classId: foundClass._id,
      cancellationDate: normalizedCancellationDate.toISOString(),
      existingCancellationsCount: existingCancellations.length,
      updatedCancellationsCount: updatedCancellations.length
    })
    
    await this.classService.updateClassInfo(foundClass, { cancellations: updatedCancellations })

    logger.debugComplete(this._FILE_NAME, this.cancelClass.name)
  }
}
const classHandler = new ClassHandler(classService, enrollmentService, invoiceService, usersService)
export { classHandler, ClassHandler }