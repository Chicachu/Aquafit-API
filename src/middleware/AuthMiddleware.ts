import asyncHandler from 'express-async-handler'
import { Permission, Query } from 'accesscontrol'
import { NextFunction, Response, Request } from 'express'
import AppError from '../types/AppError'
import { roles } from '../../config/roles'
import i18n from '../../config/i18n'
import { usersService } from '../services/UsersService'

const hasAccess = function(action: string, resource: string) {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { username } = req

    if (!username) {
      throw new AppError(i18n.__('errors.accessDenied'), 401)
    }

    try {
      const user = await usersService.getUser(username)
      const permission = <Permission>roles().can(user.role)[action as keyof Query](resource)

      if (!permission.granted) {
        throw new AppError(i18n.__('errors.accessDenied'), 401)
      }

      next()
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  })
}

const isLoggedIn = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = res.locals.loggedInUser

    if (!userId) {
      throw new AppError(i18n.__('errors.notLoggedInAccessDenied'), 400)
    }
    const user = await usersService.getUserById(userId)

    if (!user || !user.username) {
      throw new AppError(i18n.__('errors.notLoggedInAccessDenied'), 400)
    }

    req.username = user.username
    next()
  } catch (error: any) {
    throw new AppError(error.message, 500)
  }
})

export { hasAccess, isLoggedIn }