import { Model } from "mongoose";
import Collection from "../_common/collection.class";
import { AssignmentDocument, IAssignmentModel, AssignmentModel } from "./assignment.schema";
import { Assignment, AssignmentCreationDTO } from "../../types/Assignment";
import { AssignmentStatus } from "../../types/enums/AssignmentStatus";

class AssignmentCollection extends Collection<IAssignmentModel> {
  constructor(model: Model<IAssignmentModel>) {
    super(model)
  }

  async getAssignmentById(assignmentId: string): Promise<AssignmentDocument> {
    return await this.findOne({ _id: assignmentId })
  }

  async getInstructorAssignments(employeeId: string): Promise<AssignmentDocument[]> {
    return await this.find({ employeeId })
  }

  async getClassAssignments(classId: string): Promise<AssignmentDocument[]> {
    return await this.find({ classId })
  }

  async getAssignment(employeeId: string, classId: string): Promise<AssignmentDocument | null> {
    return await this.findOne({ employeeId, classId })
  }

  /** Returns user ids (instructors or employees) who have at least one *active* assignment with a payment value. Uses status only; cron checks endDate. */
  async getInstructorIdsWithPayableAssignments(): Promise<string[]> {
    const docs = await this.model
      .find({
        'paymentValue.amount': { $exists: true, $gt: 0 },
        'paymentValue.currency': { $exists: true, $in: ['MXN', 'USD'] },
        $or: [{ status: AssignmentStatus.ACTIVE }, { status: { $exists: false } }]
      })
      .distinct('employeeId')
      .lean()
    return docs as string[]
  }

  /** Returns class IDs that have at least one active assignment (any instructor). Uses status only; cron checks endDate. */
  async getClassIdsWithActiveAssignment(): Promise<string[]> {
    const docs = await this.model
      .find({
        $or: [{ status: AssignmentStatus.ACTIVE }, { status: { $exists: false } }]
      })
      .distinct('classId')
      .lean()
    return docs as string[]
  }

  /** Partial update: only the provided fields are $set on the document. */
  async updateAssignment(assignmentId: string, updateFields: Partial<Assignment>): Promise<AssignmentDocument> {
    return await this.updateOne({ _id: assignmentId }, { $set: updateFields })
  }

  /**
   * Cron-only (one of three endDate checks): assignment endDate on or before today
   * → status UNASSIGNED. Project code uses status only for active vs past vs terminated.
   */
  async updateAssignmentStatuses(): Promise<{ modifiedCount: number }> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const result = await this.model.updateMany(
      {
        $or: [{ status: AssignmentStatus.ACTIVE }, { status: { $exists: false } }],
        endDate: { $exists: true, $ne: null, $lte: today }
      },
      { $set: { status: AssignmentStatus.UNASSIGNED } }
    )
    return { modifiedCount: result.modifiedCount }
  }
}

const assignmentCollection = new AssignmentCollection(AssignmentModel)
export { assignmentCollection, AssignmentCollection }
