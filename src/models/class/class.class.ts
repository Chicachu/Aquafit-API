import { Model } from "mongoose";
import Collection from "../_common/collection.class";
import { ClassDocument, IClassModel, ClassModel } from "./class.schema";

class ClassCollection extends Collection<IClassModel> {
  constructor(model: Model<IClassModel>) {
    super(model)
  }

  async getClassById(classId: string): Promise<ClassDocument> {
    return await this.findOne({ _id: classId })
  }
}

const classCollection = new ClassCollection(ClassModel)
export { classCollection, ClassCollection }