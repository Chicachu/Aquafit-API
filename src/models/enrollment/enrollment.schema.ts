import { InferSchemaType, Model, Schema, model } from "mongoose";

const EnrollmentSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true 
    }, 
    userId: {
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    }, 
    classId: {
      type: Schema.Types.ObjectId, 
      ref: 'Class',
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