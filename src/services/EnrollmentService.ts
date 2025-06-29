import { EnrollmentCollection, enrollmentCollection } from "../models/enrollment/enrollment.class"
import { Enrollment, EnrollmentCreationDTO } from "../types/Enrollment"
import AppError from "../types/AppError"
import { logger } from "./LoggingService"
import path from "path"

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
}
const enrollmentService = new EnrollmentService(enrollmentCollection)
export {enrollmentService, EnrollmentService}