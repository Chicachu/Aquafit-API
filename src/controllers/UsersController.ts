import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { usersService } from '../services/UsersService'
import i18n from '../../config/i18n'
import AppError from '../types/AppError'
import { Role } from '../types/enums/Role'
import { authenticationService } from '../services/AuthenticationService'
import { body, validationResult } from 'express-validator'

class UsersController {
  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await usersService.getAllUsers()

    res.send({ users })
  })

  registerNewUser = [
    body('username').isString().notEmpty().withMessage(i18n.__('errors.usernameRequired')),
    body('password').isString().notEmpty().withMessage(i18n.__('errors.passwordRequired')),
    body('role').isString().notEmpty().withMessage(i18n.__('errors.roleRequired')),
    
      asyncHandler(async (req: Request, res: Response) => {
      const { username, password, role } = req.body

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(errors.array().join(', '), 400)
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

      const { encryptedPassword, accessToken } = await authenticationService.encryptPassword(user._id, password)

      user = await usersService.updateUserInfo(user, { password: encryptedPassword, accessToken })

      res.send({ user })
    })
  ]
}

const usersController = new UsersController()
export { usersController }