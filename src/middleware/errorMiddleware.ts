import { Request, Response, NextFunction } from 'express'

const errorHandler = (err: {status: number, message: string, stack: string}, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.status ? err.status : res.statusCode

  res.status(statusCode).send({
    message: err.message,
    stack: err.stack
  })
}

export { errorHandler }