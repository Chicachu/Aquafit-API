import { AssignmentCollection, assignmentCollection } from "../models/assignment/assignment.class"
import { Assignment, AssignmentCreationDTO } from "../types/Assignment"
import AppError from "../types/AppError"
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
    logger.debugInside(this._FILE_NAME, this.assignInstructor.name, { instructorId: newAssignment.instructorId, classId: newAssignment.classId })
    try {
      // Check if assignment already exists
      const existingAssignment = await this.assignmentCollection.getAssignment(newAssignment.instructorId, newAssignment.classId)
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

  async getInstructorAssignments(instructorId: string): Promise<Assignment[]> {
    logger.debugInside(this._FILE_NAME, this.getInstructorAssignments.name, { instructorId })
    try {
      return await this.assignmentCollection.getInstructorAssignments(instructorId)
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

  async updateAssignment(assignmentId: string, updateOptions: { startDate?: Date, endDate?: Date | null }): Promise<Assignment> {
    logger.debugInside(this._FILE_NAME, this.updateAssignment.name, { assignmentId, updateOptions })
    try {
      const assignment = await this.assignmentCollection.getAssignmentById(assignmentId)
      if (!assignment) {
        throw new AppError('errors.resourceNotFound', 404)
      }
      const updatedAssignment = { ...assignment, ...updateOptions }
      return await this.assignmentCollection.updateAssignment(updatedAssignment)
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
}

const assignmentService = new AssignmentService(assignmentCollection)
export { assignmentService, AssignmentService }
