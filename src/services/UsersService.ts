import path from "path"
import { userCollection, UserCollection } from "../models/user/user.class"
import AppError from "../types/AppError"
import { UpdateUserOptions, User, UserCreationDTO } from "../types/User"
import { logger } from "./LoggingService"

class UsersService {
  userCollection: UserCollection

  constructor(userCollection: UserCollection) {
    this.userCollection = userCollection
  }

  private readonly _FILE_NAME = path.basename(__filename)

  async getAllUsers(role?: string): Promise<User> {
    logger.debugInside(this._FILE_NAME, this.getAllUsers.name, { role })
    try {
      if (role) return await this.userCollection.find({ role })
      else return await this.userCollection.find()
    } catch (error: any) {
      throw new AppError('errors.resourceNotFound', 500)
    }
  }

  async getUser(username: string): Promise<User> {
    logger.debugInside(this._FILE_NAME, this.getUser.name, { username })
    try {
      return await this.userCollection.getUser(username)
    } catch (error: any) {
      throw new AppError('errors.resourceNotFound', 500)
    }
  }

  async getUserById(userId: string): Promise<User> {
    logger.debugInside(this._FILE_NAME, this.getUserById.name, { userId })
    try {
      return await this.userCollection.getUserById(userId)
    } catch (error: any) {
      throw new AppError('errors.resourceNotFound', 500)
    }
  }

  async createNewUser(user: UserCreationDTO): Promise<User> {
    logger.debugInside(this._FILE_NAME, this.createNewUser.name, { user })
    try {
      return await this.userCollection.insertOne(user)
    } catch (error: any) {
      throw new AppError('errors.unableToCreateResource', 500)
    }
  }

  async updateUserInfo(user: User, updateUserOptions: UpdateUserOptions): Promise<User> {
    try {
      const updatedUser = {
        ...user, 
        ...updateUserOptions
      }

      return await this.userCollection.updateUser(updatedUser)
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }
}

const usersService = new UsersService(userCollection)
export { usersService, UsersService }