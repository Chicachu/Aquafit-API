import { InferSchemaType, Model, Schema, model } from "mongoose";

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
    assignmentId: {
      type: String,
      ref: "Assignment",
      required: true
    },
    date: {
      type: Date,
      required: true
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
