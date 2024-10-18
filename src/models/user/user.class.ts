import { Model } from "mongoose"
import { User } from "../../types/User"
import Collection from "../_common/collection.class"
import { IUserModel, UserDocument, UserModel } from "./user.schema"

class UserCollection extends Collection<IUserModel> {
  constructor(model: Model<IUserModel>) {
    super(model)
  }

  async getAllUsers(): Promise<UserDocument[]> {
    return await this.find()
  }

  async getUser(username: string): Promise<UserDocument> {
    return await this.findOne({ username })
  }

  async getUserByid(userId: string): Promise<UserDocument> {
    return await this.findOne({ userId })
  }

  async addNewUser(user: User): Promise<UserDocument> {
    return await this.insertOne(user)
  }

  async updateAccessToken(userId: string, accessToken: string): Promise<UserDocument> {
    return await this.updateOne({ _id: userId }, { accessToken })
  }
}

const userCollection = new UserCollection(UserModel)
export { userCollection, UserCollection }