import { EnrollmentCollection, enrollmentCollection } from "../models/enrollment/enrollment.class";
import { Enrollment } from "../types/Enrollment";
import AppError from "../types/AppError";

class EnrollmentService {
  constructor(private enrollmentCollection: EnrollmentCollection) {
    this.enrollmentCollection = enrollmentCollection
  }

  async getClassEnrollmentInfo(classId: string): Promise<Enrollment[]> {
    try {
      return await this.enrollmentCollection.getClassEnrollmentInformation(classId)
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }

  async enrollClient(newEnrollment: Enrollment): Promise<Enrollment> {
      try {
        return await this.enrollmentCollection.insertOne(newEnrollment)
      } catch (error: any) {
        throw new AppError(error.message, 500)
      }
  }
}
const enrollmentService = new EnrollmentService(enrollmentCollection)
export {enrollmentService, EnrollmentService}