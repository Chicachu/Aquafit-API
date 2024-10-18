import { InferSchemaType, Model, Schema, model } from "mongoose";

const EnrollmentSchema = new Schema(
  {
    _id: String, 
    userId: {
      type: String, 
      required: true
    }, 
    classId: {
      type: String, 
      required: true
    }, 
    startDate: {
      type: Date,
      required: true
    },
    bonusSessions: Number
  },
  { timestamps: true }
)

type EnrollmentDocument = InferSchemaType<typeof EnrollmentSchema>

interface IEnrollmentDocument extends EnrollmentDocument, Document { }
interface IEnrollmentModel extends Model<IEnrollmentDocument> { }

const EnrollmentModel = model<IEnrollmentModel>('Enrollment', EnrollmentSchema)
export { EnrollmentSchema, EnrollmentDocument, IEnrollmentDocument, IEnrollmentModel, EnrollmentModel }