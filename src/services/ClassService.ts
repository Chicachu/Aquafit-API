import { ClassCollection, classCollection } from "../models/class/class.class"
import AppError from "../types/AppError"
import { Class, ClassCreationDTO, ClassUpdateOptions } from "../types/Class"
import i18n from '../../config/i18n'
import { ClassType } from "../types/enums/ClassType"
import { Weekday } from "../types/enums/Weekday"
import { Price } from "../types/Price"
import { ClassScheduleMap } from "../types/ClassScheduleMap"
import { formatSchedule } from "./util"

class ClassService {
  constructor(private classCollection: ClassCollection) {
    this.classCollection = classCollection
  }
  
  async getAllClasses(): Promise<Class[]> {
    return await this.classCollection.find()
  }

  async getClassesAtLocation(location: string): Promise<Class[]> {
    return await this.classCollection.find({ classLocation: location });
  }

  async getAllLocations(): Promise<string[]> {
    return await this.classCollection.findDistinct('classLocation')
  }

  async getClass(classId: string): Promise<Class> {
    return this.classCollection.getClassById(classId)
  }

  async getClassScheduleMap(): Promise<ClassScheduleMap> {
    const allClasses = await this.getAllClasses();
  
    const map: ClassScheduleMap = {}
  
    for (const classItem of allClasses) {
      const { classType, classLocation, startTime, days, _id } = classItem
  
      if (!map[classType]) {
        map[classType] = {};
      }
  
      if (!map[classType][classLocation]) {
        map[classType][classLocation] = {}
      }

      const formattedTime = formatSchedule(days, startTime)
  
      map[classType][classLocation][formattedTime] = _id
    }
  
    return map
  }

  async addNewClass(newClassDTO: ClassCreationDTO): Promise<Class> {
    if (await this._conflictsWithExistingClass(newClassDTO)) {
      throw new AppError(i18n.__('errors.conflictingClasses'), 400)
    }

    return await this.classCollection.insertOne(newClassDTO)
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