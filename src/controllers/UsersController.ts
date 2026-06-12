import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { usersService } from '../services/UsersService'
import AppError from '../types/AppError'
import { Role } from '../types/enums/Role'
import { authenticationService } from '../services/AuthenticationService'
import { body, param, query, validationResult } from 'express-validator'
import { UpdateUserOptions, UserCreationDTO } from '../types/User'
import { invoiceService } from '../services/InvoiceService'
import { enrollmentService } from '../services/EnrollmentService'
import { waitlistCollection } from '../models/waitlist/waitlist.class'
import { PaymentStatus } from '../types/enums/PaymentStatus'
import i18n from '../../config/i18n'
import { isAdminAquafitEmail, isInternalAquafitEmail, parseNameFromInternalEmail } from '../services/emailUtils'
import { hasStaffEmployeeId } from '../types/staffManagementRoles'

class UsersController {
  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const role = req.query.role
    const users = await usersService.getAllUsers(role as string)

    res.send(users)
  })
  
  addNewUser = [
    body('firstName').isString().trim().notEmpty(),
    body('lastName').isString().trim().notEmpty(),
    body('phoneNumber').optional().isString(),
    body('role').optional({ values: 'falsy' }).trim().isString().isIn(Object.values(Role)),
    body('employeeId').optional().custom((value) => {
      if (value === null || value === undefined) return true
      return !isNaN(Number(value))
    }),
      asyncHandler(async (req: Request, res: Response) => {
        const { firstName, lastName, phoneNumber, role, employeeId } = req.body

        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new AppError('errors.missingParameters', 400)
        }

        const roleVal = (role || Role.CLIENT) as Role
        if (roleVal === Role.EMPLOYEE) {
          throw new AppError('errors.invalidRole', 400)
        }
        if (req.username) {
          const currentUser = await usersService.getUser(req.username)
          if (currentUser?.role === Role.RECEPTIONIST && roleVal !== Role.CLIENT) {
            throw new AppError(i18n.__('errors.accessDenied'), 401)
          }
        }

        const createUserDTO: UserCreationDTO = {
          firstName: typeof firstName === 'string' ? firstName.trim() : firstName,
          lastName: typeof lastName === 'string' ? lastName.trim() : lastName,
          role: roleVal
        }
        
        if (phoneNumber !== undefined && phoneNumber !== null && String(phoneNumber).trim() !== '') {
          createUserDTO.phoneNumber = String(phoneNumber).trim()
        }

        if (employeeId !== undefined) {
          createUserDTO.employeeId = employeeId === null ? undefined : Number(employeeId)
        }
        if (hasStaffEmployeeId(roleVal) && createUserDTO.employeeId != null) {
          createUserDTO.username = String(createUserDTO.employeeId)
        }

        const createdUser = await usersService.createNewUser(createUserDTO)

        res.send(createdUser)
    })
  ]

  lookupByFirstNameAndLastName = [
    query('firstName').isString().trim().notEmpty(),
    query('lastName').isString().trim().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }
      const firstName = (req.query.firstName as string).trim()
      const lastName = (req.query.lastName as string).trim()
      const user = await usersService.findUserByFirstAndLastName(firstName, lastName)
      if (!user) {
        res.send({ found: false })
        return
      }
      res.send({
        found: true,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          phoneNumber: user.phoneNumber ?? null
        }
      })
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

  updateClient = [
    param('userId').isString().notEmpty(),
    body('firstName').optional().isString().notEmpty(),
    body('lastName').optional().isString().notEmpty(),
    body('phoneNumber').optional({ checkFalsy: true }).isString(),
    body('role').optional().isString().isIn(Object.values(Role)),
    body('employeeId').optional().custom((value) => {
      if (value === null || value === undefined) return true
      return !isNaN(Number(value))
    }),
    body('password')
      .optional()
      .custom((val) => val === undefined || val === null || val === '' || (typeof val === 'string' && val.trim().length >= 6))
      .withMessage('errors.passwordMinLength'),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        const first = errors.array()[0]
        const msg = typeof first?.msg === 'string' ? first.msg : 'errors.missingParameters'
        throw new AppError(msg, 400)
      }

      const userId = req.params.userId
      const user = await usersService.getUserById(userId)

      if (!user) {
        throw new AppError('errors.resourceNotFound', 404)
      }

      if (req.username) {
        const currentUser = await usersService.getUser(req.username)
        if (currentUser?.role === Role.RECEPTIONIST && user.role !== Role.CLIENT) {
          throw new AppError(i18n.__('errors.accessDenied'), 401)
        }
      }

      const updateData: UpdateUserOptions & { firstName?: string, lastName?: string } = {}
      if (req.body.firstName !== undefined) updateData.firstName = req.body.firstName
      if (req.body.lastName !== undefined) updateData.lastName = req.body.lastName
      if (req.body.phoneNumber !== undefined) updateData.phoneNumber = req.body.phoneNumber
      if (req.body.role !== undefined) {
        const nextRole = req.body.role as Role
        if (nextRole === Role.EMPLOYEE) {
          throw new AppError('errors.invalidRole', 400)
        }
        updateData.role = nextRole
      }
      if (req.body.employeeId !== undefined) {
        updateData.employeeId = (req.body.employeeId === null ? null : Number(req.body.employeeId)) as number | null
      }
      const passwordRaw = req.body.password
      if (typeof passwordRaw === 'string' && passwordRaw.trim().length > 0) {
        updateData.password = await authenticationService.hashPassword(passwordRaw.trim())
      }

      const roleVal = (updateData.role ?? user.role) as Role
      const employeeIdVal = updateData.employeeId !== undefined ? updateData.employeeId : user.employeeId
      if (hasStaffEmployeeId(roleVal) && employeeIdVal != null) {
        updateData.username = String(employeeIdVal)
      }

      const updatedUser = await usersService.updateUserInfo(user, updateData)

      res.send(updatedUser)
    })
  ]

  registerNewUser = [
    body('username').isString().notEmpty(),
    body('password').isString().notEmpty(),
    body('role').isString().notEmpty(),
      asyncHandler(async (req: Request, res: Response) => {
      const { username, password } = req.body

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }

      const normalizedUsername = username.toLowerCase()
      const registrationRole = isAdminAquafitEmail(normalizedUsername)
        ? Role.ADMIN
        : isInternalAquafitEmail(normalizedUsername)
          ? Role.INSTRUCTOR
          : Role.CLIENT

      let user = await usersService.getUser(normalizedUsername)

      if (registrationRole === Role.CLIENT) {
        if (!user) {
          throw new AppError('errors.notExistingClient', 400)
        }
      } else if (!user) {
        const { firstName, lastName } = parseNameFromInternalEmail(normalizedUsername)
        user = await usersService.createNewUser({
          firstName,
          lastName,
          role: registrationRole,
          username: normalizedUsername
        })
      }

      if (!user?._id) {
        throw new AppError('errors.somethingWentWrong', 500)
      }

      if (user.password) {
        throw new AppError('errors.alreadyRegistered', 409)
      }

      const { encryptedPassword, accessToken } = await authenticationService.encryptPassword(user._id, password)

      const updateUserOptions: UpdateUserOptions = {
        password: encryptedPassword,
        accessToken,
        username: normalizedUsername
      }

      if (isAdminAquafitEmail(normalizedUsername)) {
        updateUserOptions.role = Role.ADMIN
      }

      user = await usersService.updateUserInfo(user, updateUserOptions)

      res.send(user)
    })
  ]

  addNote = [
    param('userId').isString().notEmpty(),
    body('content').isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }

      const userId = req.params.userId
      const { content } = req.body

      const updatedUser = await usersService.addNoteToUser(userId, content)
      res.send(updatedUser)
    })
  ]

  deleteNote = [
    param('userId').isString().notEmpty(),
    param('noteId').isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }

      const { userId, noteId } = req.params

      const updatedUser = await usersService.deleteNoteFromUser(userId, noteId)
      res.send(updatedUser)
    })
  ]

  getCanDeleteUser = [
    param('userId').isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }
      const userId = req.params.userId
      const [enrollments, invoices, waitlistEntries] = await Promise.all([
        enrollmentService.getClientEnrollments(userId),
        invoiceService.getInvoicesByUserId(userId),
        waitlistCollection.getWaitlistEntriesByUserId(userId)
      ])
      if (enrollments.length > 0) {
        res.send({ canDelete: false, reason: i18n.__('errors.cannotDeleteUserHasEnrollments') })
        return
      }
      const unpaidInvoices = invoices.filter(
        (inv: { paymentStatus: string }) =>
          inv.paymentStatus !== PaymentStatus.PAID && inv.paymentStatus !== PaymentStatus.CANCELLED
      )
      if (unpaidInvoices.length > 0) {
        res.send({ canDelete: false, reason: i18n.__('errors.cannotDeleteUserHasUnpaidInvoices') })
        return
      }
      if (waitlistEntries.length > 0) {
        res.send({ canDelete: false, reason: i18n.__('errors.cannotDeleteUserOnWaitlist') })
        return
      }
      res.send({ canDelete: true })
    })
  ]

  deleteUser = [
    param('userId').isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }
      const userId = req.params.userId

      const user = await usersService.getUserById(userId)
      if (!user) {
        throw new AppError('errors.resourceNotFound', 404)
      }
      if (user.role !== Role.CLIENT) {
        throw new AppError('errors.cannotDeleteNonClient', 400)
      }

      const [enrollments, invoices, waitlistEntries] = await Promise.all([
        enrollmentService.getClientEnrollments(userId),
        invoiceService.getInvoicesByUserId(userId),
        waitlistCollection.getWaitlistEntriesByUserId(userId)
      ])
      if (enrollments.length > 0) {
        throw new AppError('errors.cannotDeleteUserHasEnrollments', 400)
      }
      const unpaidInvoices = invoices.filter(
        (inv: { paymentStatus: string }) =>
          inv.paymentStatus !== PaymentStatus.PAID && inv.paymentStatus !== PaymentStatus.CANCELLED
      )
      if (unpaidInvoices.length > 0) {
        throw new AppError('errors.cannotDeleteUserHasUnpaidInvoices', 400)
      }
      if (waitlistEntries.length > 0) {
        throw new AppError('errors.cannotDeleteUserOnWaitlist', 400)
      }

      await usersService.deleteUser(userId)
      res.status(200).send()
    })
  ]

  getNextEmployeeId = asyncHandler(async (req: Request, res: Response) => {
    const employeeId = await usersService.getNextEmployeeId()
    res.send({ employeeId })
  })
}

const usersController = new UsersController()
export { usersController }