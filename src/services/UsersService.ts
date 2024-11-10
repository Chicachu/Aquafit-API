import { Types } from "mongoose"
import { userCollection, UserCollection } from "../models/user/user.class"
import AppError from "../types/AppError"
import { UpdateUserOptions, User, UserCreationDTO } from "../types/User"

class UsersService {
  userCollection: UserCollection

  constructor(userCollection: UserCollection) {
    this.userCollection = userCollection
  }

  async getAllUsers(): Promise<User> {
    try {
      return await this.userCollection.find()
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }

  async getUser(username: string): Promise<User> {
    try {
      return await this.userCollection.getUser(username)
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }

  async getUserById(userId: Types.ObjectId): Promise<User> {
    try {
      return await this.userCollection.getUserById(userId)
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }

  async createNewUser(user: UserCreationDTO): Promise<User> {
    try {
      return await this.userCollection.insertOne(user)
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }

  async updateUserInfo(user: User, updateUserOptions: UpdateUserOptions): Promise<User> {
    try {
      const updatedUser = {
        ...user, 
        ...updateUserOptions
      }

      return await this.userCollection.updateUser(user)
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }
}

const usersService = new UsersService(userCollection)
export { usersService, UsersService }