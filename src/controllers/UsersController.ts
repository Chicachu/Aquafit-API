import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { usersService } from '../services/UsersService'
import i18n from '../../config/i18n'
import AppError from '../types/AppError'
import { Role } from '../types/enums/Role'
import { authenticationService } from '../services/AuthenticationService'

class UsersController {
  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await usersService.getAllUsers()

    res.send({ users })
  })

  registerNewUser = asyncHandler(async (req: Request, res: Response) => {
    const { username, password, role } = req.body

    if (!username || !password || !role) {
      throw new AppError(i18n.__('errors.cannotRegisterMissingInfo'), 400)
    }

    let user = await usersService.getUser(username)
    if (role === Role.CLIENT) {
      if (!user) {
        throw new AppError(i18n.__('errors.notExistingClient'), 400)
      }
    }

    if (!user._id) {
      throw new AppError(i18n.__('errors.somethingWentWrong'), 500)
    }

    const encryptedPassword = await authenticationService.encryptPassword(password)
    const accessToken = await authenticationService.createAccessToken(user._id)
    const updatedUser = {
      ...user, 
      password: encryptedPassword,
      accessToken
    }

    user = await usersService.updateUser(updatedUser)

    res.send({ user })
  })
}

const usersController = new UsersController()
export { usersController }