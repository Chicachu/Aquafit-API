import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { usersService } from "../services/UsersService"
import AppError from "../types/AppError"
import { authenticationService } from '../services/AuthenticationService'
import { body, validationResult } from 'express-validator'
import { logger } from '../services/LoggingService'

class AuthenticationController {
  login = [
    body('username').isString().notEmpty(),
    body('password').isString().notEmpty(),

    asyncHandler(async (req: Request, res: Response) => {
      const { username, password } = req.body

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }

      const identifier = String(username).trim()
      const isEmployeeId = /^\d{6}$/.test(identifier)
      let user = isEmployeeId
        ? await usersService.getUserByEmployeeId(parseInt(identifier, 10))
        : await usersService.getUser(identifier)

      if (!user) {
        throw new AppError('errors.incorrectCredentials', 400)
      }

      const accessToken = await authenticationService.authenticateUser(user, password)

      user = await usersService.updateUserInfo(user, { accessToken })

      logger.access(`${user.username ?? identifier} has logged in.`)
      res.send(user)
    })
  ]
}

const authenticationController = new AuthenticationController()
export { authenticationController, AuthenticationController }
