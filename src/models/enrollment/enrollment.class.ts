import { Model } from "mongoose";
import Collection from "../_common/collection.class";
import { EnrollmentDocument, EnrollmentModel, IEnrollmentModel } from "./enrollment.schema";
import { Enrollment } from "../../types/Enrollment";


class EnrollmentCollection extends Collection<IEnrollmentModel> {
  constructor(model: Model<IEnrollmentModel>) {
    super(model)
  }

  async getClientEnrollmentInformation(userId: string): Promise<Enrollment> {
    return await this.findOne({ userId })
  }

  async getClassEnrollmentInformation(classId: string): Promise<Enrollment[]> {
    return await this.find({ classId })
  }

  async getEnrollment(classId: string, userId: string): Promise<Enrollment> {
    return await this.findOne({ classId, userId })
  }

  async enrollClient(enrollment: Enrollment): Promise<Enrollment> {
    return await this.insertOne(enrollment)
  }
}

const enrollmentCollection = new EnrollmentCollection(EnrollmentModel)
export { enrollmentCollection, EnrollmentCollection }