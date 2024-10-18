import asyncHandler from 'express-async-handler'
import { Permission, Query } from 'accesscontrol'
import { NextFunction, Request, Response } from 'express'
import AppError from '../types/AppError'
import { roles } from '../../config/roles'
import i18n from '../../config/i18n'

const hasAccess = function(action: string, resource: string) {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req

    if (!user) {
      throw new AppError(i18n.__('errors.accessDenied'), 401)
    }

    try {
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
    const user = res.locals.loggedInUser

    if (!user) {
      throw new AppError(i18n.__('errors.notLoggedInAccessDenied'), 400)
    }

    req.user = user
    next()
  } catch (error: any) {
    throw new AppError(error.message, 500)
  }
})

export { hasAccess, isLoggedIn }