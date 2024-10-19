import { ClassCollection, classCollection } from "../models/class/class.class"
import { Class } from "../types/Class"


class ClassService {
  classCollection: ClassCollection

  constructor(classCollection: ClassCollection) {
    this.classCollection = classCollection
  }

  async addNewClass(newClass: Class): Promise<Class> {
    return await this.classCollection.insertOne(newClass)
  }

  async updateClassInfo(updatedClass: Class): Promise<Class> {
    return await this.classCollection.updateClass(updatedClass)
  }
}

const classService = new ClassService(classCollection)
export { classService, ClassService }