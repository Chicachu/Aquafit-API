import { Model } from "mongoose"
import { v4 as uuid } from 'uuid'
import AppError from "../../types/AppError"
import i18n from "../../../config/i18n"
import { ClassCreationDTO } from "../../types/Class"

abstract class Collection<T> {
  model: Model<any>

  constructor(model: Model<any>) {
    this.model = model
  }

  async find(query: object = {}, limit?: number, offset?: number): Promise<any> {
    try {
      return await this.model.find(query).limit(limit!).skip(offset!).lean()
    } catch (error) {
      throw error
    }
  }

  async findConflicts(newClass: ClassCreationDTO): Promise<any> {
    const convertedDays: number[] = newClass.days.map(day => Number(day))
    const startDate = new Date(newClass.startDate)

    const query = {
      days: { $in: convertedDays },
      startTime: newClass.startTime,
      startDate: { $lte: startDate },
      $or: [
        { endDate: { $gte: startDate } },
        { endDate: { $eq: null } }
      ]
    }

    return await this.model.find(query)
  }

  async findOne(query: object = {}): Promise<any> {
    return await this.model.findOne(query).lean()
  }

  async findDistinct(property: string): Promise<any> {
    return await this.model.distinct(property)
  }

  async insertOne(data: object): Promise<any> {
    try {
      const newModel = new this.model({_id: uuid(), ...data })
      let insertedModel: Model<any>
      await newModel.save().then((savedDocument: any) => {insertedModel = savedDocument})
      return insertedModel!
    }
    catch (error) {
      throw new AppError(i18n.__(''), 500) 
    }
  }

  async updateOne(query: object = {}, update: object = {}): Promise<any> {
    try {
      return await this.model.findOneAndUpdate(query, update, { returnDocument: 'after' }).lean()
    } catch (error) {
      throw error
    }
  }

  async deleteOne(query: object = {}): Promise<void> {
    try {
      await this.model.deleteOne(query)
    } catch (error) {
      throw error
    }
  }
}

export default Collection