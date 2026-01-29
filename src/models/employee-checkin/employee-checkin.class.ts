import { Model } from "mongoose";
import { v4 as uuid } from "uuid";
import {
  EmployeeCheckInDocument,
  IEmployeeCheckInModel,
  EmployeeCheckInModel
} from "./employee-checkin.schema";
import type { EmployeeCheckInCreationDTO } from "../../types/EmployeeCheckIn";

class EmployeeCheckInCollection {
  model: Model<IEmployeeCheckInModel>;

  constructor(model: Model<IEmployeeCheckInModel>) {
    this.model = model;
  }

  async create(dto: EmployeeCheckInCreationDTO): Promise<EmployeeCheckInDocument> {
    const doc = new this.model({ _id: uuid(), ...dto });
    await doc.save();
    return doc.toObject() as unknown as EmployeeCheckInDocument;
  }

  /** All check-in and check-out entries in the month, sorted by date asc. Used for work-interval–based payable logic. */
  async getEntriesForEmployeeInMonth(
    employeeId: string,
    year: number,
    month: number
  ): Promise<{ type: string; date: Date }[]> {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const docs = await this.model
      .find({
        employeeId,
        type: { $in: ["check-in", "check-out"] },
        date: { $gte: start, $lte: end }
      })
      .select({ type: 1, date: 1 })
      .sort({ date: 1 })
      .lean();
    return docs as unknown as { type: string; date: Date }[];
  }

  async hasCheckInsInMonth(employeeId: string, year: number, month: number): Promise<boolean> {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const count = await this.model.countDocuments({
      employeeId,
      date: { $gte: start, $lte: end }
    });
    return count > 0;
  }

  async getAllEntriesForEmployee(employeeId: string): Promise<EmployeeCheckInDocument[]> {
    const docs = await this.model
      .find({ employeeId })
      .sort({ date: -1 })
      .lean();
    return docs as unknown as EmployeeCheckInDocument[];
  }
}

const employeeCheckInCollection = new EmployeeCheckInCollection(EmployeeCheckInModel);
export { employeeCheckInCollection, EmployeeCheckInCollection };
