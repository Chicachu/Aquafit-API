import { Model } from "mongoose";
import { v4 as uuid } from "uuid";
import {
  EmployeePayableDocument,
  IEmployeePayableModel,
  EmployeePayableModel
} from "./employee-payable.schema";
import { EmployeePayableCreationDTO } from "../../types/EmployeePayable";

class EmployeePayableCollection {
  model: Model<IEmployeePayableModel>;

  constructor(model: Model<IEmployeePayableModel>) {
    this.model = model;
  }

  async findOne(query: object): Promise<EmployeePayableDocument | null> {
    const doc = await this.model.findOne(query).lean();
    return doc as unknown as EmployeePayableDocument | null;
  }

  async find(query: object): Promise<EmployeePayableDocument[]> {
    const docs = await this.model.find(query).sort({ "period.endDate": -1 }).lean();
    return docs as unknown as EmployeePayableDocument[];
  }

  async create(dto: EmployeePayableCreationDTO): Promise<EmployeePayableDocument> {
    const doc = new this.model({ _id: uuid(), ...dto });
    await doc.save();
    return doc.toObject() as unknown as EmployeePayableDocument;
  }

  async updateOne(filter: object, update: object): Promise<EmployeePayableDocument | null> {
    const doc = await this.model
      .findOneAndUpdate(filter, update, { returnDocument: "after" })
      .lean();
    return doc as unknown as EmployeePayableDocument | null;
  }

  async getByEmployeeId(employeeId: string): Promise<EmployeePayableDocument[]> {
    return this.find({ employeeId });
  }
}

const employeePayableCollection = new EmployeePayableCollection(EmployeePayableModel);
export { employeePayableCollection, EmployeePayableCollection };
