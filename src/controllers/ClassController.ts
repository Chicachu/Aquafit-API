import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import { classService } from '../services/ClassService'

class ClassController {
  addNewClass = asyncHandler(async (req: Request, res: Response) => {
    
  })

  getAllClasses = asyncHandler(async (req: Request, res: Response) => {
    const classes = await classService.getAllClasses()

    res.send(classes)
  })
}

const classController = new ClassController() 
export { classController, ClassController } 

