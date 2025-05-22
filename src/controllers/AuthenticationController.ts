import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { usersService } from "../services/UsersService"
import AppError from "../types/AppError"
import i18n from '../../config/i18n'
import { authenticationService } from '../services/AuthenticationService'
import { body, validationResult } from 'express-validator'

class AuthenticationController {
  login = [
    body('username').isString().notEmpty().withMessage(i18n.__('errors.usernameRequired')),
    body('password').isString().notEmpty().withMessage(i18n.__('errors.passwordRequired')),
    
      asyncHandler(async (req: Request, res: Response) => {
      const { username, password } = req.body

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError(i18n.__('errors.missingParameters'), 400)
      }

      let user = await usersService.getUser(username)

      const accessToken = await authenticationService.authenticateUser(user, password)

      user = await usersService.updateUserInfo(user, { accessToken })

      res.send(user)
    })
  ]
}

const authenticationController = new AuthenticationController()
export { authenticationController, AuthenticationController }
