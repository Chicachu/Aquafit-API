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

  /**
   * Checks if there's an open check-in (no matching check-out) that starts on or before the given date.
   * Returns the open check-in if found, null otherwise.
   */
  async getOpenCheckInBeforeDate(employeeId: string, date: Date): Promise<EmployeeCheckInDocument | null> {
    // Get all entries for this employee up to the given date, sorted by date ascending
    const entries = await this.model
      .find({
        employeeId,
        date: { $lte: date }
      })
      .sort({ date: 1 })
      .lean();

    // Count check-ins and check-outs to determine if there's an open check-in
    // Odd number of entries means there's an open check-in
    let checkInCount = 0;
    let checkOutCount = 0;
    let lastOpenCheckIn: EmployeeCheckInDocument | null = null;

    for (const entry of entries as unknown as Array<{ type: string; date: Date; _id: string; employeeId: string }>) {
      if (entry.type === "check-in") {
        checkInCount++;
        lastOpenCheckIn = entry as unknown as EmployeeCheckInDocument;
      } else if (entry.type === "check-out") {
        checkOutCount++;
        // If we have a matching check-out, there's no open check-in
        if (checkInCount === checkOutCount) {
          lastOpenCheckIn = null;
        }
      }
    }

    // If check-in count > check-out count, there's an open check-in
    return checkInCount > checkOutCount ? lastOpenCheckIn : null;
  }

  /**
   * Checks if there's an open check-in (odd number of check-ins/check-outs).
   * Returns true if a check-out is allowed (there's an open check-in).
   */
  async hasOpenCheckIn(employeeId: string): Promise<boolean> {
    const entries = await this.model
      .find({ employeeId })
      .select({ type: 1 })
      .sort({ date: 1 })
      .lean() as unknown as Array<{ type: string }>;

    let checkInCount = 0;
    let checkOutCount = 0;

    for (const entry of entries) {
      if (entry.type === "check-in") {
        checkInCount++;
      } else if (entry.type === "check-out") {
        checkOutCount++;
      }
    }

    // Odd number means there's an open check-in (check-in count > check-out count)
    return checkInCount > checkOutCount;
  }
}

const employeeCheckInCollection = new EmployeeCheckInCollection(EmployeeCheckInModel);
export { employeeCheckInCollection, EmployeeCheckInCollection };
