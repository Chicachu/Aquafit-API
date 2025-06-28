import path from "path"
import { ClassCollection, classCollection } from "../models/class/class.class"
import AppError from "../types/AppError"
import { Class, ClassCreationDTO, ClassUpdateOptions } from "../types/Class"
import { ClassScheduleMap } from "../types/ClassScheduleMap"
import { logger } from "./LoggingService"
import { formatSchedule } from "./util"

class ClassService {
  constructor(private classCollection: ClassCollection) {
    this.classCollection = classCollection
  }

  private readonly _FILE_NAME = path.basename(__filename)
  
  async getAllClasses(): Promise<Class[]> {
    logger.debugInside(this._FILE_NAME, this.getAllClasses.name)
    return await this.classCollection.find()
  }

  async getClassesAtLocation(location: string): Promise<Class[]> {
    logger.debugInside(this._FILE_NAME, this.getClassesAtLocation.name)
    return await this.classCollection.find({ classLocation: location });
  }

  async getAllLocations(): Promise<string[]> {
    logger.debugInside(this._FILE_NAME, this.getAllLocations.name)
    return await this.classCollection.findDistinct('classLocation')
  }

  async getClass(classId: string): Promise<Class> {
    logger.debugInside(this._FILE_NAME, this.getClass.name, { classId })
    return this.classCollection.getClassById(classId)
  }

  async getClassScheduleMap(): Promise<ClassScheduleMap> {
    logger.debugInside(this._FILE_NAME, this.getClassScheduleMap.name)
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
  
    logger.debugComplete(this._FILE_NAME, this.getClassScheduleMap.name)
    return map
  }

  async addNewClass(newClassDTO: ClassCreationDTO): Promise<Class> {
    logger.debugInside(this._FILE_NAME, this.addNewClass.name, { newClassDTO })
    if (await this._conflictsWithExistingClass(newClassDTO)) {
      throw new AppError('errors.conflictingClasses', 400)
    }

    logger.debugComplete(this._FILE_NAME, this.addNewClass.name)
    return await this.classCollection.insertOne(newClassDTO)
  }

  async updateClassInfo(currentClass: Class, classUpdateOptions: ClassUpdateOptions): Promise<Class> {
    logger.debugInside(this._FILE_NAME, this.updateClassInfo.name, { currentClass: currentClass._id })
    const updatedClass = {
      ...currentClass, 
      ...classUpdateOptions

    }
    
    logger.debugComplete(this._FILE_NAME, this.updateClassInfo.name)
    return await this.classCollection.updateClass(updatedClass)
  }

  private async _conflictsWithExistingClass(newClass: ClassCreationDTO): Promise<boolean> {
    const conflictingClasses = await this.classCollection.findConflicts(newClass)

    return conflictingClasses.length > 0
  }
}

const classService = new ClassService(classCollection)
export { classService, ClassService }