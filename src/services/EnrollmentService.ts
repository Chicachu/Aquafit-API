import { Types } from "mongoose";
import { EnrollmentCollection } from "../models/enrollment/enrollment.class";
import { Enrollment } from "../types/Enrollment";
import AppError from "../types/AppError";

class EnrollmentService {
  enrollmentCollection: EnrollmentCollection

  constructor(enrollmentCollection: EnrollmentCollection) {
    this.enrollmentCollection = enrollmentCollection
  }

  async enrollClient(newEnrollment: Enrollment): Promise<Enrollment> {
      try {
        return await this.enrollmentCollection.insertOne(newEnrollment)
      } catch (error: any) {
        throw new AppError(error.message, 500)
      }
  }
}