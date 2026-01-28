import { InferSchemaType, Model, Schema, model } from "mongoose";
import { CheckInType } from "../../types/EmployeeCheckIn";

const EmployeeCheckInSchema = new Schema(
  {
    _id: {
      type: String,
      required: true
    },
    employeeId: {
      type: String,
      ref: "User",
      required: true
    },
    type: {
      type: String,
      enum: Object.values(CheckInType),
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    assignmentId: {
      type: String,
      ref: "Assignment",
      required: false
    }
  },
  { timestamps: true }
);

EmployeeCheckInSchema.index({ employeeId: 1, date: 1 });

type EmployeeCheckInDocument = InferSchemaType<typeof EmployeeCheckInSchema>;
interface IEmployeeCheckInDocument extends EmployeeCheckInDocument, Document {}
interface IEmployeeCheckInModel extends Model<IEmployeeCheckInDocument> {}

const EmployeeCheckInModel = model<IEmployeeCheckInModel>("EmployeeCheckIn", EmployeeCheckInSchema);
export {
  EmployeeCheckInSchema,
  EmployeeCheckInDocument,
  IEmployeeCheckInDocument,
  IEmployeeCheckInModel,
  EmployeeCheckInModel
};
