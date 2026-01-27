import { InferSchemaType, model, Model, Schema } from "mongoose";
import { PaymentStatus } from "../../types/enums/PaymentStatus";
import { AmountSchema } from "../_common/amount.schema";

const PayablePeriodSchema = new Schema(
  {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  { _id: false }
);

const LineItemSchema = new Schema(
  {
    assignmentId: { type: String, ref: "Assignment", required: true },
    sessionsCount: { type: Number, required: true },
    amount: { type: AmountSchema, required: true }
  },
  { _id: false }
);

const InstructorPayableSchema = new Schema(
  {
    _id: { type: String, required: true },
    instructorId: { type: String, ref: "User", required: true },
    period: { type: PayablePeriodSchema, required: true },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), required: true },
    charge: { type: AmountSchema, required: true },
    lineItems: { type: [LineItemSchema], required: false, default: [] }
  },
  { timestamps: true }
);

InstructorPayableSchema.index({ instructorId: 1, "period.startDate": 1 }, { unique: true });

type InstructorPayableDocument = InferSchemaType<typeof InstructorPayableSchema>;
interface IInstructorPayableDocument extends InstructorPayableDocument, Document {}
interface IInstructorPayableModel extends Model<IInstructorPayableDocument> {}

const InstructorPayableModel = model<IInstructorPayableModel>("InstructorPayable", InstructorPayableSchema);
export {
  InstructorPayableSchema,
  InstructorPayableDocument,
  IInstructorPayableDocument,
  IInstructorPayableModel,
  InstructorPayableModel
};
