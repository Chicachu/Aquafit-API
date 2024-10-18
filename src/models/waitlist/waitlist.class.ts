import { Model } from "mongoose";
import Collection from "../_common/collection.class";
import { IWaitlistModel, WaitlistDocument } from "./waitlist.schema";

class WaitlistCollection extends Collection<IWaitlistModel> {
  constructor(model: Model<IWaitlistModel>) {
    super(model)
  }

  async addClientToWaitlist(userId: string, classId: string): Promise<WaitlistDocument> {
    return await this.insertOne({ userId, classId })
  }

  async removeClientFromWaitlist(userId: string, classId: string): Promise<void> {
    return await this.deleteOne({ userId, classId })
  }
}