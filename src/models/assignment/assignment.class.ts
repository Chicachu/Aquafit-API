import { Model } from "mongoose";
import Collection from "../_common/collection.class";
import { AssignmentDocument, IAssignmentModel, AssignmentModel } from "./assignment.schema";
import { Assignment, AssignmentCreationDTO } from "../../types/Assignment";

class AssignmentCollection extends Collection<IAssignmentModel> {
  constructor(model: Model<IAssignmentModel>) {
    super(model)
  }

  async getAssignmentById(assignmentId: string): Promise<AssignmentDocument> {
    return await this.findOne({ _id: assignmentId })
  }

  async getInstructorAssignments(instructorId: string): Promise<AssignmentDocument[]> {
    return await this.find({ instructorId })
  }

  async getClassAssignments(classId: string): Promise<AssignmentDocument[]> {
    return await this.find({ classId })
  }

  async getAssignment(instructorId: string, classId: string): Promise<AssignmentDocument | null> {
    return await this.findOne({ instructorId, classId })
  }

  async updateAssignment(updatedAssignment: Assignment): Promise<AssignmentDocument> {
    return await this.updateOne({ _id: updatedAssignment._id }, { $set: updatedAssignment })
  }
}

const assignmentCollection = new AssignmentCollection(AssignmentModel)
export { assignmentCollection, AssignmentCollection }
