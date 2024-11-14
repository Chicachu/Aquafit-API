import { InferSchemaType, Model, Schema, model } from "mongoose";

const EnrollmentSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
      auto: true 
    }, 
    userId: {
      type: String, 
      ref: 'User',
      required: true
    }, 
    classId: {
      type: String, 
      ref: 'Class',
      required: true
    }, 
    startDate: {
      type: Date,
      required: true
    },
    sessionsOverride: Number,
    bonusSessions: Number
  },
  { timestamps: true }
)

type EnrollmentDocument = InferSchemaType<typeof EnrollmentSchema>

interface IEnrollmentDocument extends EnrollmentDocument, Document { }
interface IEnrollmentModel extends Model<IEnrollmentDocument> { }

const EnrollmentModel = model<IEnrollmentModel>('Enrollment', EnrollmentSchema)
export { EnrollmentSchema, EnrollmentDocument, IEnrollmentDocument, IEnrollmentModel, EnrollmentModel }