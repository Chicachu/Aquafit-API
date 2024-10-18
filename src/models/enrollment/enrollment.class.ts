import { Model } from "mongoose";
import Collection from "../_common/collection.class";
import { EnrollmentDocument, EnrollmentModel, IEnrollmentModel } from "./enrollment.schema";
import { Enrollment } from "../../types/Enrollment";


class EnrollmentCollection extends Collection<IEnrollmentModel> {
  constructor(model: Model<IEnrollmentModel>) {
    super(model)
  }

  async getClientEnrollmentInformation(userId: string): Promise<EnrollmentDocument> {
    return await this.findOne({ userId })
  }

  async getClassEnrollmentInformation(classId: string): Promise<EnrollmentDocument> {
    return await this.findOne({ classId })
  }

  async enrollClient(enrollment: Enrollment): Promise<EnrollmentDocument> {
    return await this.insertOne(enrollment)
  }
}

const enrollmentCollection = new EnrollmentCollection(EnrollmentModel)
export { enrollmentCollection, EnrollmentCollection }