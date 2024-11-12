import { Model } from "mongoose"
import { User } from "../../types/User"
import Collection from "../_common/collection.class"
import { IUserModel, UserDocument, UserModel } from "./user.schema"

class UserCollection extends Collection<IUserModel> {
  constructor(model: Model<IUserModel>) {
    super(model)
  }

  async getUser(username: string): Promise<UserDocument> {
    return await this.findOne({ username })
  }

  async getUserById(userId: string): Promise<UserDocument> {
    return await this.findOne({ userId })
  }

  async updateUser(user: User): Promise<UserDocument> {
    return await this.updateOne({ username: user.username}, user)
  }
}

const userCollection = new UserCollection(UserModel)
export { userCollection, UserCollection }