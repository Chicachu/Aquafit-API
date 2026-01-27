import { Model } from "mongoose";
import Collection from "../_common/collection.class";
import { ClassDocument, IClassModel, ClassModel } from "./class.schema";
import { Class } from "../../types/Class";

class ClassCollection extends Collection<IClassModel> {
  constructor(model: Model<IClassModel>) {
    super(model)
  }

  async updateClass(updatedClass: Class): Promise<ClassDocument> {
    // Use $set to ensure nested arrays and subdocuments are properly updated
    return await this.updateOne({ _id: updatedClass._id }, { $set: updatedClass })
  }

  async getClassById(classId: string): Promise<ClassDocument> {
    return await this.findOne({ _id: classId })
  }
}

const classCollection = new ClassCollection(ClassModel)
export { classCollection, ClassCollection }