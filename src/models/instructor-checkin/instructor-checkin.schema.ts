import { InferSchemaType, Model, Schema, model } from "mongoose";

const InstructorCheckInSchema = new Schema(
  {
    _id: {
      type: String,
      required: true
    },
    instructorId: {
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

InstructorCheckInSchema.index({ instructorId: 1, date: 1 });

type InstructorCheckInDocument = InferSchemaType<typeof InstructorCheckInSchema>;
interface IInstructorCheckInDocument extends InstructorCheckInDocument, Document {}
interface IInstructorCheckInModel extends Model<IInstructorCheckInDocument> {}

const InstructorCheckInModel = model<IInstructorCheckInModel>("InstructorCheckIn", InstructorCheckInSchema);
export {
  InstructorCheckInSchema,
  InstructorCheckInDocument,
  IInstructorCheckInDocument,
  IInstructorCheckInModel,
  InstructorCheckInModel
};
