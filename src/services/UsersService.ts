import path from "path"
import { userCollection, UserCollection } from "../models/user/user.class"
import AppError from "../types/AppError"
import { UpdateUserOptions, User, UserCreationDTO, Note } from "../types/User"
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
      if (role) return await this.userCollection.find({ role }) as User
      else return await this.userCollection.find() as User
    } catch (error: any) {
      throw new AppError('errors.resourceNotFound', 500)
    }
  }

  async getUserFirstAndLastName(userId: string): Promise<{firstName: string, lastName: string, _id: string}> {
    logger.debugInside(this._FILE_NAME, this.getUserFirstAndLastName.name, {userId})
    try {
      return await this.userCollection.getUserFirstAndLastName(userId)
    } catch (error: any) {
      throw new AppError('errors.resourceNotFound', 500)
    }
  }

  async getUser(username: string): Promise<User> {
    logger.debugInside(this._FILE_NAME, this.getUser.name, { username })
    try {
      return await this.userCollection.getUser(username) as User
    } catch (error: any) {
      throw new AppError('errors.resourceNotFound', 500)
    }
  }

  async getUserById(userId: string): Promise<User> {
    logger.debugInside(this._FILE_NAME, this.getUserById.name, { userId })
    try {
      return await this.userCollection.getUserById(userId) as User
    } catch (error: any) {
      throw new AppError('errors.resourceNotFound', 500)
    }
  }

  async getUsersById(userIds: string[]): Promise<User[]> {
    logger.debugInside(this._FILE_NAME, this.getUsersById.name, { userIds })
    try {
      return await this.userCollection.getUsersById(userIds) as User[]
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
    logger.debugInside(this._FILE_NAME, this.updateUserInfo.name, { user })
    try {
      const updatedUser = {
        ...user, 
        ...updateUserOptions
      }

      // Use updateOne with _id if we have it, otherwise fall back to username
      if (user._id) {
        return await this.userCollection.updateOne({ _id: user._id }, updateUserOptions) as User
      } else {
        return await this.userCollection.updateUser(updatedUser) as User
      }
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }

  async addNoteToUser(userId: string, content: string): Promise<User> {
    logger.debugInside(this._FILE_NAME, this.addNoteToUser.name, { userId, content })
    try {
      const user = await this.userCollection.getUserById(userId)
      if (!user) {
        throw new AppError('errors.resourceNotFound', 404)
      }

      const newNote: Note = {
        _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        content,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const existingNotes = user.notes ? (Array.isArray(user.notes) ? [...user.notes] : []) : []
      const notes = [...existingNotes, newNote]

      const updatedUser = await this.userCollection.updateOne({ _id: userId }, { notes })
      return updatedUser as User
    } catch (error: any) {
      if (error instanceof AppError) throw error
      throw new AppError('errors.unableToCreateResource', 500)
    }
  }

  async deleteNoteFromUser(userId: string, noteId: string): Promise<User> {
    logger.debugInside(this._FILE_NAME, this.deleteNoteFromUser.name, { userId, noteId })
    try {
      const user = await this.userCollection.getUserById(userId)
      if (!user) {
        throw new AppError('errors.resourceNotFound', 404)
      }

      const existingNotes = user.notes ? (Array.isArray(user.notes) ? [...user.notes] : []) : []
      const notes = existingNotes.filter((note: Note) => note._id !== noteId)
      
      const updatedUser = await this.userCollection.updateOne({ _id: userId }, { notes })
      return updatedUser as User
    } catch (error: any) {
      if (error instanceof AppError) throw error
      throw new AppError('errors.unableToDeleteResource', 500)
    }
  }

  async getNextEmployeeId(): Promise<number> {
    logger.debugInside(this._FILE_NAME, this.getNextEmployeeId.name, {})
    try {
      const staff = await this.userCollection.find({ role: { $in: ['instructor', 'employee'] } }) as User[]
      const existingIds = new Set<number>()
      if (staff && Array.isArray(staff)) {
        staff
          .map((u: User) => u.instructorId)
          .filter((id): id is number => id !== null && id !== undefined)
          .forEach(id => existingIds.add(id))
      }
      return this._generateUniqueSixDigitId(existingIds)
    } catch (error: any) {
      logger.error(`Error in ${this._FILE_NAME}:${this.getNextEmployeeId.name} - ${error?.message || error}`)
      throw new AppError('errors.unableToGetResource', 500)
    }
  }

  private _generateUniqueSixDigitId(existingIds: Set<number>): number {
    const minId = 100000
    const maxId = 999999
    const maxAttempts = 100
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const randomId = Math.floor(Math.random() * (maxId - minId + 1)) + minId
      if (!existingIds.has(randomId)) return randomId
    }
    let nextId = minId
    while (existingIds.has(nextId) && nextId <= maxId) nextId++
    if (nextId > maxId) throw new AppError('errors.unableToGetResource', 500)
    return nextId
  }
}

const usersService = new UsersService(userCollection)
export { usersService, UsersService }