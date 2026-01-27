import { InferSchemaType, Model, Schema, model } from "mongoose";
import { AmountSchema } from "../_common/amount.schema";
import { AssignmentStatus } from "../../types/enums/AssignmentStatus";

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
    },
    paymentPerSession: {
      type: AmountSchema,
      required: false
    },
    status: {
      type: String,
      enum: Object.values(AssignmentStatus),
      default: AssignmentStatus.ACTIVE
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
