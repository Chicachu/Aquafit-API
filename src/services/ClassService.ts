import { ClassCollection, classCollection } from "../models/class/class.class"
import AppError from "../types/AppError"
import { Class, ClassCreationDTO, ClassUpdateOptions } from "../types/Class"
import i18n from '../../config/i18n'
import { ClassType } from "../types/enums/ClassType"
import { Weekday } from "../types/enums/Weekday"
import { Price } from "../types/Price"
import { ClassScheduleMap } from "../types/ClassScheduleMap"

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
  
    const map: ClassScheduleMap = {};
  
    for (const classItem of allClasses) {
      const { classType, classLocation, startTime } = classItem;
  
      if (!map[classType]) {
        map[classType] = {};
      }
  
      if (!map[classType][classLocation]) {
        map[classType][classLocation] = [];
      }
  
      if (!map[classType][classLocation].includes(startTime)) {
        map[classType][classLocation].push(startTime);
      }
    }
  
    return map;
  }

  async addNewClass(
    classLocation: string, 
    classType: ClassType, 
    days: Weekday[], 
    startDate: Date, 
    startTime: string, 
    prices: Price[], 
    maxCapacity: number
  ): Promise<Class> {
    const newClass: ClassCreationDTO = {
      classLocation, 
      classType, 
      days, 
      startDate, 
      startTime, 
      prices, 
      maxCapacity
    }
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