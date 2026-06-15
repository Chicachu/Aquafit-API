import { AssignmentCollection, assignmentCollection } from "../models/assignment/assignment.class"
import { Assignment, AssignmentCreationDTO, AssignmentUpdateOptions } from "../types/Assignment"
import AppError from "../types/AppError"
import { AssignmentStatus } from "../types/enums/AssignmentStatus"
import { logger } from "./LoggingService"
import path from "path"

class AssignmentService {
  constructor(private assignmentCollection: AssignmentCollection) {
    this.assignmentCollection = assignmentCollection
  }

  private readonly _FILE_NAME = path.basename(__filename)

  async getAllAssignments(): Promise<Assignment[]> {
    logger.debugInside(this._FILE_NAME, this.getAllAssignments.name)
    try {
      return await this.assignmentCollection.find()
    } catch (error: any) {
      throw new AppError('errors.couldNotGetAssignmentInfo', 500)
    }
  }

  async assignInstructor(newAssignment: AssignmentCreationDTO): Promise<Assignment> {
    logger.debugInside(this._FILE_NAME, this.assignInstructor.name, { employeeId: newAssignment.employeeId, classId: newAssignment.classId })
    try {
      // Check if assignment already exists
      const existingAssignment = await this.assignmentCollection.getAssignment(newAssignment.employeeId, newAssignment.classId)
      if (existingAssignment) {
        throw new AppError('errors.assignmentAlreadyExists', 400)
      }
      return await this.assignmentCollection.insertOne(newAssignment)
    } catch (error: any) {
      if (error instanceof AppError) throw error
      throw new AppError('errors.unableToAssignInstructor', 500)
    }
  }

  async getAssignmentById(assignmentId: string): Promise<Assignment> {
    logger.debugInside(this._FILE_NAME, this.getAssignmentById.name, { assignmentId })
    try {
      return await this.assignmentCollection.getAssignmentById(assignmentId)
    } catch (error: any) {
      throw new AppError('errors.couldNotGetAssignmentInfo', 500)
    }
  }

  async getInstructorAssignments(employeeId: string): Promise<Assignment[]> {
    logger.debugInside(this._FILE_NAME, this.getInstructorAssignments.name, { employeeId })
    try {
      return await this.assignmentCollection.getInstructorAssignments(employeeId)
    } catch (error: any) {
      throw new AppError('errors.couldNotGetAssignmentInfo', 500)
    }
  }

  async getClassAssignments(classId: string): Promise<Assignment[]> {
    logger.debugInside(this._FILE_NAME, this.getClassAssignments.name, { classId })
    try {
      return await this.assignmentCollection.getClassAssignments(classId)
    } catch (error: any) {
      throw new AppError('errors.couldNotGetAssignmentInfo', 500)
    }
  }

  async getInstructorIdsWithPayableAssignments(): Promise<string[]> {
    logger.debugInside(this._FILE_NAME, this.getInstructorIdsWithPayableAssignments.name)
    try {
      return await this.assignmentCollection.getInstructorIdsWithPayableAssignments()
    } catch (error: any) {
      throw new AppError('errors.couldNotGetAssignmentInfo', 500)
    }
  }

  async getClassIdsWithActiveAssignment(): Promise<string[]> {
    logger.debugInside(this._FILE_NAME, this.getClassIdsWithActiveAssignment.name)
    try {
      return await this.assignmentCollection.getClassIdsWithActiveAssignment()
    } catch (error: any) {
      throw new AppError('errors.couldNotGetAssignmentInfo', 500)
    }
  }

  async updateAssignment(assignmentId: string, updateOptions: AssignmentUpdateOptions): Promise<Assignment> {
    logger.debugInside(this._FILE_NAME, this.updateAssignment.name, { assignmentId, updateOptions })
    try {
      const assignment = await this.assignmentCollection.getAssignmentById(assignmentId)
      if (!assignment) {
        throw new AppError('errors.resourceNotFound', 404)
      }

      const updateFields: Partial<Assignment> = { ...updateOptions }

      if (updateOptions.endDate !== undefined) {
        if (updateOptions.endDate) {
          const endDate = new Date(updateOptions.endDate)
          endDate.setHours(0, 0, 0, 0)
          updateFields.endDate = endDate

          const today = new Date()
          today.setHours(0, 0, 0, 0)
          if (endDate <= today) {
            updateFields.status = AssignmentStatus.UNASSIGNED
          }
        } else {
          updateFields.endDate = null
        }
      }

      return await this.assignmentCollection.updateAssignment(assignmentId, updateFields)
    } catch (error: any) {
      if (error instanceof AppError) throw error
      throw new AppError('errors.unableToUpdateAssignment', 500)
    }
  }

  async deleteAssignment(assignmentId: string): Promise<void> {
    logger.debugInside(this._FILE_NAME, this.deleteAssignment.name, { assignmentId })
    try {
      await this.assignmentCollection.deleteOne({ _id: assignmentId })
    } catch (error: any) {
      throw new AppError('errors.unableToDeleteAssignment', 500)
    }
  }

  async updateAssignmentStatuses(): Promise<{ modifiedCount: number }> {
    logger.debugInside(this._FILE_NAME, this.updateAssignmentStatuses.name)
    try {
      return await this.assignmentCollection.updateAssignmentStatuses()
    } catch (error: any) {
      throw new AppError('errors.unableToUpdateResource', 500)
    }
  }
}

const assignmentService = new AssignmentService(assignmentCollection)
export { assignmentService, AssignmentService }
