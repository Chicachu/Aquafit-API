import { Model } from "mongoose";
import { v4 as uuid } from "uuid";
import {
  InstructorCheckInDocument,
  IInstructorCheckInModel,
  InstructorCheckInModel
} from "./instructor-checkin.schema";
import type { InstructorCheckInCreationDTO } from "../../types/InstructorCheckIn";

class InstructorCheckInCollection {
  model: Model<IInstructorCheckInModel>;

  constructor(model: Model<IInstructorCheckInModel>) {
    this.model = model;
  }

  async create(dto: InstructorCheckInCreationDTO): Promise<InstructorCheckInDocument> {
    const doc = new this.model({ _id: uuid(), ...dto });
    await doc.save();
    return doc.toObject() as unknown as InstructorCheckInDocument;
  }

  async getCheckInsForInstructorInMonth(
    instructorId: string,
    year: number,
    month: number
  ): Promise<{ assignmentId: string; date: Date }[]> {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const docs = await this.model
      .find({
        instructorId,
        date: { $gte: start, $lte: end }
      })
      .select({ assignmentId: 1, date: 1 })
      .lean();
    return docs as unknown as { assignmentId: string; date: Date }[];
  }

  async hasCheckInsInMonth(instructorId: string, year: number, month: number): Promise<boolean> {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const count = await this.model.countDocuments({
      instructorId,
      date: { $gte: start, $lte: end }
    });
    return count > 0;
  }
}

const instructorCheckInCollection = new InstructorCheckInCollection(InstructorCheckInModel);
export { instructorCheckInCollection, InstructorCheckInCollection };
