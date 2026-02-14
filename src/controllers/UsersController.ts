import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { usersService } from '../services/UsersService'
import AppError from '../types/AppError'
import { Role } from '../types/enums/Role'
import { authenticationService } from '../services/AuthenticationService'
import { body, param, query, validationResult } from 'express-validator'
import { UpdateUserOptions, UserCreationDTO } from '../types/User'
import { clientHandler } from '../business/ClientHandler'
import { classService } from '../services/ClassService'
import { InstructorClassDetails } from '../types/InstructorClassDetails'
import { assignmentService } from '../services/AssignmentService'
import { invoiceService } from '../services/InvoiceService'
import { enrollmentService } from '../services/EnrollmentService'
import { waitlistCollection } from '../models/waitlist/waitlist.class'
import { PaymentStatus } from '../types/enums/PaymentStatus'
import * as employeePayableService from '../services/EmployeePayableService'
import { logger } from '../services/LoggingService'
import i18n from '../../config/i18n'

class UsersController {
  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const role = req.query.role
    const users = await usersService.getAllUsers(role as string)

    res.send(users)
  })
  
  addNewUser = [
    body('firstName').isString().notEmpty(),
    body('lastName').isString().notEmpty(),
    body('phoneNumber').optional().isString().notEmpty(),
    body('role').optional().isString().isIn(Object.values(Role)),
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

        const createUserDTO: UserCreationDTO = {
          firstName, 
          lastName, 
          role: role || Role.CLIENT
        }
        
        if (phoneNumber) {
          createUserDTO.phoneNumber = phoneNumber
        }

        if (employeeId !== undefined) {
          createUserDTO.employeeId = employeeId === null ? undefined : Number(employeeId)
        }

        const roleVal = (role || Role.CLIENT) as Role
        if ((roleVal === Role.INSTRUCTOR || roleVal === Role.EMPLOYEE) && createUserDTO.employeeId != null) {
          createUserDTO.username = String(createUserDTO.employeeId)
        }

        await usersService.createNewUser(createUserDTO)

        res.send()
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

  getInvoicesByUserId = [
    param('userId').isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }
      const userId = req.params.userId
      const [invoices, employeePayables, name] = await Promise.all([
        invoiceService.getInvoicesByUserId(userId),
        employeePayableService.getPayablesByUserId(userId),
        usersService.getUserFirstAndLastName(userId)
      ])
      const userName = `${name.firstName} ${name.lastName}`.trim()
      res.send({ invoices, employeePayables, userName })
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

  getPayableDetails = [
    param('userId').isString().notEmpty(),
    param('payableId').isString().notEmpty(),
    asyncHandler(async (req: Request, res: Response) => {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }
      const { userId, payableId } = req.params
      const payable = await employeePayableService.getPayableDetailsWithComputedAmounts(userId, payableId)
      if (!payable) {
        throw new AppError('errors.resourceNotFound', 404)
      }
      res.send(payable)
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

      const updateData: UpdateUserOptions & { firstName?: string, lastName?: string } = {}
      if (req.body.firstName !== undefined) updateData.firstName = req.body.firstName
      if (req.body.lastName !== undefined) updateData.lastName = req.body.lastName
      if (req.body.phoneNumber !== undefined) updateData.phoneNumber = req.body.phoneNumber
      if (req.body.role !== undefined) updateData.role = req.body.role as Role
      if (req.body.employeeId !== undefined) {
        updateData.employeeId = (req.body.employeeId === null ? null : Number(req.body.employeeId)) as number | null
      }
      const passwordRaw = req.body.password
      if (typeof passwordRaw === 'string' && passwordRaw.trim().length > 0) {
        updateData.password = await authenticationService.hashPassword(passwordRaw.trim())
      }

      const roleVal = (updateData.role ?? user.role) as Role
      const employeeIdVal = updateData.employeeId !== undefined ? updateData.employeeId : user.employeeId
      if ((roleVal === Role.INSTRUCTOR || roleVal === Role.EMPLOYEE) && employeeIdVal != null) {
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

      user = await usersService.updateUserInfo(user, {
        password: encryptedPassword,
        accessToken,
        username: username.toLowerCase()
      })

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

  getInstructorClassDetails = [
    param('userId').isString().notEmpty(),
      asyncHandler(async (req: Request, res: Response) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
          throw new AppError('errors.missingParameters', 400)
        }
        const userId = req.params.userId 
        const instructor = await usersService.getUserById(userId)
        
        if (!instructor || instructor.role !== Role.INSTRUCTOR) {
          throw new AppError('errors.resourceNotFound', 404)
        }

        const assignments = await assignmentService.getInstructorAssignments(userId)
        const assignmentInfo: { class: any, assignment: any }[] = []
        
        for (const assignment of assignments) {
          const classInfo = await classService.getClass(assignment.classId)
          if (!classInfo) {
            logger.info(
              'UsersController',
              'getInstructorClassDetails',
              `Skipping assignment ${assignment._id}: class ${assignment.classId} not found`,
              { assignmentId: assignment._id, classId: assignment.classId }
            )
            continue
          }
          assignmentInfo.push({ class: classInfo, assignment })
        }
        
        const instructorClassDetails: InstructorClassDetails = {
          instructor,
          assignmentInfo
        }

        res.send(instructorClassDetails)
      })
  ]
}

const usersController = new UsersController()
export { usersController }