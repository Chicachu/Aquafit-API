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

  async getUserByEmployeeId(employeeId: number): Promise<UserDocument | null> {
    return await this.findOne({ employeeId })
  }

  async getUserById(userId: string): Promise<UserDocument> {
    return await this.findOne({ _id: userId })
  }

  async getUsersById(userIds: string[]): Promise<UserDocument[]> {
    return await this.find({ _id: { $in: userIds } })
  }

  async updateUser(user: User): Promise<UserDocument> {
    return await this.updateOne({ username: user.username}, user)
  }

  async getUserFirstAndLastName(userId: string): Promise<{firstName: string, lastName: string, _id: string}> {
    const user = await this.findOne(
      { _id: userId },
      { firstName: 1, lastName: 1, _id: 1 }  
    )

    return user
  }

  async findOneByFirstAndLastName(firstName: string, lastName: string): Promise<UserDocument | null> {
    const normalizedFirst = firstName.trim()
    const normalizedLast = lastName.trim()
    return await this.findOne({
      firstName: normalizedFirst,
      lastName: normalizedLast
    })
  }
}

const userCollection = new UserCollection(UserModel)
export { userCollection, UserCollection }