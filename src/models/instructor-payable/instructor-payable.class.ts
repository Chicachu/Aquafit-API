import { Model } from "mongoose";
import { v4 as uuid } from "uuid";
import {
  InstructorPayableDocument,
  IInstructorPayableModel,
  InstructorPayableModel
} from "./instructor-payable.schema";
import { InstructorPayableCreationDTO } from "../../types/InstructorPayable";

class InstructorPayableCollection {
  model: Model<IInstructorPayableModel>;

  constructor(model: Model<IInstructorPayableModel>) {
    this.model = model;
  }

  async findOne(query: object): Promise<InstructorPayableDocument | null> {
    const doc = await this.model.findOne(query).lean();
    return doc as unknown as InstructorPayableDocument | null;
  }

  async find(query: object): Promise<InstructorPayableDocument[]> {
    const docs = await this.model.find(query).sort({ "period.endDate": -1 }).lean();
    return docs as unknown as InstructorPayableDocument[];
  }

  async create(dto: InstructorPayableCreationDTO): Promise<InstructorPayableDocument> {
    const doc = new this.model({ _id: uuid(), ...dto });
    await doc.save();
    return doc.toObject() as unknown as InstructorPayableDocument;
  }

  async updateOne(filter: object, update: object): Promise<InstructorPayableDocument | null> {
    const doc = await this.model
      .findOneAndUpdate(filter, update, { returnDocument: "after" })
      .lean();
    return doc as unknown as InstructorPayableDocument | null;
  }

  async getByInstructorId(instructorId: string): Promise<InstructorPayableDocument[]> {
    return this.find({ instructorId });
  }
}

const instructorPayableCollection = new InstructorPayableCollection(InstructorPayableModel);
export { instructorPayableCollection, InstructorPayableCollection };
