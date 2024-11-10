import { ClassCollection, classCollection } from "../models/class/class.class"
import { Class, ClassCreationDTO, ClassUpdateOptions } from "../types/Class"


class ClassService {
  classCollection: ClassCollection

  constructor(classCollection: ClassCollection) {
    this.classCollection = classCollection
  }

  async addNewClass(newClass: ClassCreationDTO): Promise<Class> {
    return await this.classCollection.insertOne(newClass)
  }

  async updateClassInfo(currentClass: Class, classUpdateOptions: ClassUpdateOptions): Promise<Class> {
    const updatedClass = {
      ...currentClass, 
      ...classUpdateOptions
    }
    return await this.classCollection.updateClass(updatedClass)
  }
}

const classService = new ClassService(classCollection)
export { classService, ClassService }