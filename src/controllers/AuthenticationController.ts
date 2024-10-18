import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { usersService } from "../services/UsersService"
import AppError from "../types/AppError"
import i18n from '../../config/i18n'
import { authenticationService } from '../services/AuthenticationService'

class AuthenticationController {
  login = asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body

    if (!username || !password) {
      throw new AppError(i18n.__('errors.missingCredentials'), 400)
    } 

    let user = await usersService.getUser(username)

    const accessToken = await authenticationService.authenticateUser(user, password)
    user = await usersService.saveAccessToken(user._id!, accessToken)

    res.send({ user: user })
  })
}

const authenticationController = new AuthenticationController()
export { authenticationController, AuthenticationController }
