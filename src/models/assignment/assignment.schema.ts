import { InferSchemaType, Model, Schema, model } from "mongoose";

const AssignmentSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
      auto: true 
    }, 
    instructorId: {
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
    endDate: {
      type: Date,
      required: false
    }
  },
  { timestamps: true }
)

AssignmentSchema.index({ instructorId: 1, classId: 1 }, { unique: true })

type AssignmentDocument = InferSchemaType<typeof AssignmentSchema>

interface IAssignmentDocument extends AssignmentDocument, Document { }
interface IAssignmentModel extends Model<IAssignmentDocument> { }

const AssignmentModel = model<IAssignmentModel>('Assignment', AssignmentSchema)
export { AssignmentSchema, AssignmentDocument, IAssignmentDocument, IAssignmentModel, AssignmentModel }
