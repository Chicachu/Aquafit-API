import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import { usersService } from '../services/UsersService'

class UsersController {
  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await usersService.getAllUsers()

    res.send({ users: users })
  })

  registerNewUser = asyncHandler(async (req: Request, res: Response) => {
    const { username, password, role } = req.body
  })
}

const usersController = new UsersController()
export { usersController }