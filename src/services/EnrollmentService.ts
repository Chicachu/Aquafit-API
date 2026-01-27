import { EnrollmentCollection, enrollmentCollection } from "../models/enrollment/enrollment.class"
import { Enrollment, EnrollmentCreationDTO } from "../types/Enrollment"
import AppError from "../types/AppError"
import { logger } from "./LoggingService"
import path from "path"
import { EnrollmentStatus } from "../types/enums/EnrollmentStatus"
import { invoiceService } from "./InvoiceService"
import { classService } from "./ClassService"
import { usersService } from "./UsersService"
import { formatSchedule } from "./util"
import i18n from "../../config/i18n"

class EnrollmentService {
  constructor(private enrollmentCollection: EnrollmentCollection) {
    this.enrollmentCollection = enrollmentCollection
  }

  private readonly _FILE_NAME = path.basename(__filename)

  async getAllEnrollments(): Promise<Enrollment[]> {
    logger.debugInside(this._FILE_NAME, this.getAllEnrollments.name)
    try {
      return await this.enrollmentCollection.find()
    } catch (error: any) {
      throw new AppError('errors.couldNotGetEnrollmentInfo', 500)
    }
  }

  async getClassEnrollmentInfo(classId: string): Promise<Enrollment[]> {
    logger.debugInside(this._FILE_NAME, this.getClassEnrollmentInfo.name, { classId })
    try {
      return await this.enrollmentCollection.getClassEnrollmentInformation(classId)
    } catch (error: any) {
      throw new AppError('errors.couldNotGetEnrollmentInfo', 500)
    }
  }

  async enrollClient(newEnrollment: EnrollmentCreationDTO): Promise<Enrollment> {
    logger.debugInside(this._FILE_NAME, this.enrollClient.name, { userId: newEnrollment.userId, classId: newEnrollment.classId })
      try {
        return await this.enrollmentCollection.insertOne(newEnrollment)
      } catch (error: any) {
        throw new AppError('error.unableToEnrollClient', 500)
      }
  }

  async getEnrollmentById(enrollmentId: string): Promise<Enrollment> {
    logger.debugInside(this._FILE_NAME, this.getEnrollment.name, { enrollmentId })
    try {
      return await this.enrollmentCollection.getEnrollmentById(enrollmentId)
    } catch (error: any) {
      throw new AppError('errors.couldNotGetEnrollmentInfo', 500)
    }
  }

  async getEnrollment(classId: string, userId: string): Promise<Enrollment> {
    logger.debugInside(this._FILE_NAME, this.getEnrollment.name, { userId, classId })
    try {
      return await this.enrollmentCollection.getEnrollment(classId, userId)
    } catch (error: any) {
      throw new AppError('errors.couldNotGetEnrollmentInfo', 500)
    }
  }

  async getClientEnrollments(userId: string): Promise<Enrollment[]> {
    logger.debugInside(this._FILE_NAME, this.getClientEnrollments.name, { userId })
    try {
      return await this.enrollmentCollection.getClientEnrollments(userId)
    } catch (error: any) {
      throw new AppError('errors.couldNotGetEnrollmentInfo', 500)
    }
  }

  async getClassIdFromEnrollment(enrollmentId: string): Promise<string> {
    logger.debugInside(this._FILE_NAME, this.getClassIdFromEnrollment.name, { enrollmentId })
    
    try {
      const enrollment = await this.enrollmentCollection.findOne({ _id: enrollmentId }, { classId: 1 })
      
      if (!enrollment || !enrollment.classId) {
        throw new AppError('errors.resourceNotFound', 404)
      }
  
      return enrollment.classId
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }

  async addInvoice(enrollmentId: string, invoiceId: string): Promise<Enrollment> {
    logger.debugInside(this._FILE_NAME, this.addInvoice.name, { enrollmentId, invoiceId })
    try {
      const updatedEnrollment = await this.enrollmentCollection.updateOne(
        { _id: enrollmentId },
        { $addToSet: { invoiceIds: invoiceId } }
      )
  
      if (!updatedEnrollment) {
        throw new AppError('errors.resourceNotFound', 404, { enrollmentId });
      }
  
      return updatedEnrollment;
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }

  async updateAutoEnrollment(enrollmentId: string, autoEnrollment: boolean): Promise<Enrollment> {
    logger.debugInside(this._FILE_NAME, this.updateAutoEnrollment.name, { enrollmentId, autoEnrollment })
    try {
      const updatedEnrollment = await this.enrollmentCollection.updateOne(
        { _id: enrollmentId },
        { $set: { autoEnrollment } }
      )

      if (!updatedEnrollment) {
        throw new AppError('errors.resourceNotFound', 404, { enrollmentId })
      }

      return updatedEnrollment
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }

  async updateBonusSessions(enrollmentId: string, bonusSessions: number): Promise<Enrollment> {
    logger.debugInside(this._FILE_NAME, this.updateBonusSessions.name, { enrollmentId, bonusSessions })
    try {
      const updatedEnrollment = await this.enrollmentCollection.updateOne(
        { _id: enrollmentId },
        { $set: { bonusSessions } }
      )

      if (!updatedEnrollment) {
        throw new AppError('errors.resourceNotFound', 404, { enrollmentId })
      }

      return updatedEnrollment
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }

  async updateBonusSessionsConsumed(enrollmentId: string, bonusSessionsConsumed: number): Promise<Enrollment> {
    logger.debugInside(this._FILE_NAME, this.updateBonusSessionsConsumed.name, { enrollmentId, bonusSessionsConsumed })
    try {
      const updatedEnrollment = await this.enrollmentCollection.updateOne(
        { _id: enrollmentId },
        { $set: { bonusSessionsConsumed } }
      )

      if (!updatedEnrollment) {
        throw new AppError('errors.resourceNotFound', 404, { enrollmentId })
      }

      return updatedEnrollment
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }

  async unenrollClient(enrollmentId: string, cancelReason?: string): Promise<Enrollment> {
    logger.debugInside(this._FILE_NAME, this.unenrollClient.name, { enrollmentId, cancelReason })
    try {
      // Get the enrollment
      const enrollment = await this.getEnrollmentById(enrollmentId)
      
      if (!enrollment) {
        throw new AppError('errors.resourceNotFound', 404, { enrollmentId })
      }

      // Check if already terminated (can't unenroll from terminated classes)
      if (enrollment.status === EnrollmentStatus.TERMINATED) {
        throw new AppError('errors.enrollmentAlreadyCancelled', 400)
      }

      // Check if already has an endDate set (already scheduled for unenrollment)
      if (enrollment.endDate) {
        const existingEndDate = new Date(enrollment.endDate)
        existingEndDate.setHours(0, 0, 0, 0)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        // If endDate is in the future, it's already scheduled for unenrollment
        if (existingEndDate > today) {
          throw new AppError('errors.enrollmentAlreadyCancelled', 400)
        }
      }

      // Get the current invoice to get the actual end date (original + bonus sessions)
      let endDate: Date
      if (enrollment.invoiceIds && enrollment.invoiceIds.length > 0) {
        try {
          const currentInvoice = await invoiceService.getCurrentInvoice(enrollment.invoiceIds)
          endDate = new Date(currentInvoice.period.endDate)
          endDate.setHours(0, 0, 0, 0)
        } catch (error) {
          // If no invoice found, use today's date
          endDate = new Date()
          endDate.setHours(0, 0, 0, 0)
        }
      } else {
        // If no invoices, use today's date
        endDate = new Date()
        endDate.setHours(0, 0, 0, 0)
      }

      // Update enrollment - keep status as ACTIVE, cron job will update it after endDate passes
      const updateData: any = {
        endDate,
        autoEnrollment: false
      }

      if (cancelReason) {
        updateData.cancelReason = cancelReason
      }

      const updatedEnrollment = await this.enrollmentCollection.updateOne(
        { _id: enrollmentId },
        { $set: updateData }
      )

      if (!updatedEnrollment) {
        throw new AppError('errors.resourceNotFound', 404, { enrollmentId })
      }

      // If a reason was provided, add it as a note to the client
      if (cancelReason) {
        try {
          const classInfo = await classService.getClass(enrollment.classId)
          const effectiveDays = enrollment.daysOfWeekOverride && enrollment.daysOfWeekOverride.length > 0
            ? enrollment.daysOfWeekOverride
            : classInfo.days
          
          const schedule = formatSchedule(effectiveDays, classInfo.startTime)
          const notePrefix = i18n.__('notes.reasonForUnenrollingIn')
          // Translate class type using i18n
          const translatedClassType = i18n.__('CLASS_TYPES.' + classInfo.classType)
          const noteContent = `${notePrefix} ${translatedClassType} ${classInfo.classLocation} ${schedule}: ${cancelReason}`
          
          await usersService.addNoteToUser(enrollment.userId, noteContent)
        } catch (error: any) {
          // Log error but don't fail the unenrollment if note addition fails
          logger.error(`Error adding note to user in ${this._FILE_NAME}:${this.unenrollClient.name} - ${error?.message || error}`)
        }
      }

      logger.debugComplete(this._FILE_NAME, this.unenrollClient.name)
      return updatedEnrollment
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error
      }
      logger.error(`Error in ${this._FILE_NAME}:${this.unenrollClient.name} - ${error?.message || error}`)
      throw new AppError('errors.unableToUpdateResource', 500)
    }
  }

  async updateEnrollmentStatuses(): Promise<void> {
    logger.debugInside(this._FILE_NAME, this.updateEnrollmentStatuses.name)
    try {
      const allEnrollments = await this.getAllEnrollments()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)

      for (const enrollment of allEnrollments) {
        let newStatus: EnrollmentStatus | null = null

        // Skip if already unenrolled or terminated
        if (enrollment.status === EnrollmentStatus.UNENROLLED || enrollment.status === EnrollmentStatus.TERMINATED) {
          continue
        }

        // Check if enrollment has an endDate that has passed (yesterday or earlier)
        if (enrollment.endDate) {
          const endDate = new Date(enrollment.endDate)
          endDate.setHours(0, 0, 0, 0)
          if (endDate <= yesterday) {
            newStatus = EnrollmentStatus.UNENROLLED
          }
        }

        // If not unenrolled, check if the class was terminated
        if (!newStatus) {
          try {
            const classInfo = await classService.getClass(enrollment.classId)
            if (classInfo.endDate) {
              const classEndDate = new Date(classInfo.endDate)
              classEndDate.setHours(0, 0, 0, 0)
              if (classEndDate <= today) {
                newStatus = EnrollmentStatus.TERMINATED
              }
            }
          } catch (error) {
            // If we can't get the class, skip this enrollment
            continue
          }
        }

        // If no specific status determined, set to ACTIVE (temporary - should be default)
        if (!newStatus) {
          newStatus = EnrollmentStatus.ACTIVE
        }

        // Only update if status has changed
        if (enrollment.status !== newStatus) {
          await this.enrollmentCollection.updateOne(
            { _id: enrollment._id },
            { $set: { status: newStatus } }
          )
        }
      }

      logger.debugComplete(this._FILE_NAME, this.updateEnrollmentStatuses.name)
    } catch (error: any) {
      logger.error(`Error in ${this._FILE_NAME}:${this.updateEnrollmentStatuses.name} - ${error?.message || error}`)
      throw new AppError('errors.unableToUpdateResource', 500)
    }
  }
}
const enrollmentService = new EnrollmentService(enrollmentCollection)
export {enrollmentService, EnrollmentService}