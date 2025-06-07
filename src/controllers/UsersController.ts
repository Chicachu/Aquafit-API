import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { usersService } from '../services/UsersService'
import i18n from '../../config/i18n'
import AppError from '../types/AppError'
import { Role } from '../types/enums/Role'
import { authenticationService } from '../services/AuthenticationService'
import { body, param, validationResult } from 'express-validator'
import { UserCreationDTO } from '../types/User'
import { clientHandler } from '../business/ClientHandler'

class UsersController {
  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const role = req.query.role
    const users = await usersService.getAllUsers(role as string)

    res.send(users)
  })
  
  addNewUser = [
    body('firstName').isString().notEmpty().withMessage(i18n.__('errors.missingParameters')),
    body('lastName').isString().notEmpty().withMessage(i18n.__('errors.missingParameters')),
    body('phoneNumber').isString().notEmpty().withMessage(i18n.__('errors.missingParameters')),
      asyncHandler(async (req: Request, res: Response) => {
        const { firstName, lastName, phoneNumber } = req.body

        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new AppError(i18n.__('errors.missingParameters'), 400)
        }

        const createUserDTO: UserCreationDTO = {
          firstName, 
          lastName, 
          phoneNumber, 
          role: Role.CLIENT
        }

        await usersService.createNewUser(createUserDTO)

        res.send()
    })
  ]

  getUser = [
    param('userId').isString().notEmpty().withMessage(i18n.__('errors.missingParameters')),
      asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new AppError(i18n.__('errors.missingParameters'), 400)
        }
        const userId = req.params.userId 
        const user = await usersService.getUserById(userId)

        res.send(user)
    })
  ]

  getClientEnrollmentDetails = [
    param('userId').isString().notEmpty().withMessage(i18n.__('errors.missingParameters')),
      asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new AppError(i18n.__('errors.missingParameters'), 400)
        }
        const userId = req.params.userId 
        const clientEnrollmentDetails = await clientHandler.getClientEnrollmentDetails(userId)

        res.send(clientEnrollmentDetails)
      })
  ]

  registerNewUser = [
    body('username').isString().notEmpty().withMessage(i18n.__('errors.usernameRequired')),
    body('password').isString().notEmpty().withMessage(i18n.__('errors.passwordRequired')),
    body('role').isString().notEmpty().withMessage(i18n.__('errors.roleRequired')),
      asyncHandler(async (req: Request, res: Response) => {
      const { username, password, role } = req.body

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(i18n.__('errors.missingParameters'), 400)
      }

      let user = await usersService.getUser(username.toLowerCase())

      if (role === Role.CLIENT || role === Role.INSTRUCTOR) {
        if (!user) {
          throw new AppError(i18n.__('errors.notExistingClient'), 400)
        }
      }

      if (!user?._id) {
        throw new AppError(i18n.__('errors.somethingWentWrong'), 500)
      }

      if (user.password) {
        throw new AppError(i18n.__('errors.alreadyRegistered'), 409)
      }

      const { encryptedPassword, accessToken } = await authenticationService.encryptPassword(user._id, password)

      user = await usersService.updateUserInfo(user, { password: encryptedPassword, accessToken })

      res.send(user)
    })
  ]
}

const usersController = new UsersController()
export { usersController }