import { Model } from "mongoose";
import Collection from "../_common/collection.class";
import { IWaitlistModel, WaitlistDocument, WaitlistModel } from "./waitlist.schema";

class WaitlistCollection extends Collection<IWaitlistModel> {
  constructor(model: Model<IWaitlistModel>) {
    super(model)
  }

  async findOneByUserAndClass(userId: string, classId: string): Promise<WaitlistDocument | null> {
    return await this.findOne({ userId, classId })
  }

  async addWaitlistEntry(userId: string, classId: string): Promise<WaitlistDocument> {
    return await this.insertOne({ userId, classId })
  }

  async getAllWaitlistEntriesByClass(classId: string): Promise<WaitlistDocument[]> {
    return await this.find({ classId }, undefined, undefined)
  }

  async getAllWaitlistEntries(): Promise<WaitlistDocument[]> {
    return await this.find({}, undefined, undefined)
  }

  async getWaitlistEntriesByUserId(userId: string): Promise<WaitlistDocument[]> {
    return await this.find({ userId }, undefined, undefined)
  }

  async removeWaitlistEntry(waitlistId: string): Promise<void> {
    return await this.deleteOne({ _id: waitlistId })
  }

  async removeWaitlistEntryByUserAndClass(userId: string, classId: string): Promise<void> {
    return await this.deleteOne({ userId, classId })
  }
}

const waitlistCollection = new WaitlistCollection(WaitlistModel)
export { waitlistCollection, WaitlistCollection }