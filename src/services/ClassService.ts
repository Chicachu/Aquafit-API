import { ClassCollection, classCollection } from "../models/class/class.class"
import AppError from "../types/AppError"
import { Class, ClassCreationDTO, ClassUpdateOptions } from "../types/Class"
import i18n from '../../config/i18n'

class ClassService {
  constructor(private classCollection: ClassCollection) {
    this.classCollection = classCollection
  }
  
  async getAllClasses(): Promise<Class[]> {
    return await this.classCollection.find()
  }

  async getAllLocations(): Promise<string[]> {
    return await this.classCollection.findDistinct('classLocation')
  }

  async getClass(classId: string): Promise<Class> {
    return this.classCollection.getClassById(classId)
  }

  async addNewClass(newClass: ClassCreationDTO): Promise<Class> {
    if (await this._conflictsWithExistingClass(newClass)) {
      throw new AppError(i18n.__('errors.conflictingClasses'), 400)
    }

    return await this.classCollection.insertOne(newClass)
  }

  async updateClassInfo(currentClass: Class, classUpdateOptions: ClassUpdateOptions): Promise<Class> {
    const updatedClass = {
      ...currentClass, 
      ...classUpdateOptions

    }
    return await this.classCollection.updateClass(updatedClass)
  }

  private async _conflictsWithExistingClass(newClass: ClassCreationDTO): Promise<boolean> {
    const conflictingClasses = await this.classCollection.findConflicts(newClass)

    return conflictingClasses.length > 0
  }
}

const classService = new ClassService(classCollection)
export { classService, ClassService }