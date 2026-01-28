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

const EmployeePayableSchema = new Schema(
  {
    _id: { type: String, required: true },
    employeeId: { type: String, ref: "User", required: true },
    period: { type: PayablePeriodSchema, required: true },
    paymentStatus: { type: String, enum: Object.values(PaymentStatus), required: true },
    charge: { type: AmountSchema, required: true },
    lineItems: { type: [LineItemSchema], required: false, default: [] }
  },
  { timestamps: true }
);

EmployeePayableSchema.index({ employeeId: 1, "period.startDate": 1 }, { unique: true });

type EmployeePayableDocument = InferSchemaType<typeof EmployeePayableSchema>;
interface IEmployeePayableDocument extends EmployeePayableDocument, Document {}
interface IEmployeePayableModel extends Model<IEmployeePayableDocument> {}

const EmployeePayableModel = model<IEmployeePayableModel>("EmployeePayable", EmployeePayableSchema);
export {
  EmployeePayableSchema,
  EmployeePayableDocument,
  IEmployeePayableDocument,
  IEmployeePayableModel,
  EmployeePayableModel
};
