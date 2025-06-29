import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { usersService } from '../services/UsersService'
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
    body('firstName').isString().notEmpty(),
    body('lastName').isString().notEmpty(),
    body('phoneNumber').isString().notEmpty(),
      asyncHandler(async (req: Request, res: Response) => {
        const { firstName, lastName, phoneNumber } = req.body

        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new AppError('errors.missingParameters', 400)
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
    param('userId').isString().notEmpty(),
      asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new AppError('errors.missingParameters', 400)
        }
        const userId = req.params.userId 
        const user = await usersService.getUserById(userId)

        res.send(user)
    })
  ]

  getClientEnrollmentDetails = [
    param('userId').isString().notEmpty(),
      asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new AppError('errors.missingParameters', 400)
        }
        const userId = req.params.userId 
        const clientEnrollmentDetails = await clientHandler.getClientEnrollmentDetails(userId)

        res.send(clientEnrollmentDetails)
      })
  ]

  getInvoiceHistory = [
    param('userId').isString().notEmpty(), 
    param('enrollmentId').isString().notEmpty(),
      asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new AppError('errors.missingParameters', 400)
        }

        const { userId, enrollmentId } = req.params
        const invoiceHistory = await clientHandler.getInvoiceHistory(userId, enrollmentId)

        res.send(invoiceHistory)
      })
  ]

  getInvoiceDetails = [
    param('invoiceId').isString().notEmpty(),
    param('userId').isString().notEmpty(), 
    param('enrollmentId').isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }
  
      const { invoiceId, userId, enrollmentId } = req.params
      const invoiceDetails = await clientHandler.getInvoiceDetails(invoiceId, userId, enrollmentId)
  
      res.send(invoiceDetails)
    })
  ]

  registerNewUser = [
    body('username').isString().notEmpty(),
    body('password').isString().notEmpty(),
    body('role').isString().notEmpty(),
      asyncHandler(async (req: Request, res: Response) => {
      const { username, password, role } = req.body

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }

      let user = await usersService.getUser(username.toLowerCase())

      if (role === Role.CLIENT || role === Role.INSTRUCTOR) {
        if (!user) {
          throw new AppError('errors.notExistingClient', 400)
        }
      }

      if (!user?._id) {
        throw new AppError('errors.somethingWentWrong', 500)
      }

      if (user.password) {
        throw new AppError('errors.alreadyRegistered', 409)
      }

      const { encryptedPassword, accessToken } = await authenticationService.encryptPassword(user._id, password)

      user = await usersService.updateUserInfo(user, { password: encryptedPassword, accessToken })

      res.send(user)
    })
  ]
}

const usersController = new UsersController()
export { usersController }