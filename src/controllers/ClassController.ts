import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'

class ClassController {
  addNewClass = asyncHandler(async (req: Request, res: Response) => {
    
  })
}

const classController = new ClassController() 
export { classController, ClassController } 

