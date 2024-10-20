import dotenv from 'dotenv'
import express from 'express'
import jwt from 'jsonwebtoken'
import { errorHandler } from './src/middleware/ErrorMiddleware'
import AppError from './src/types/AppError'
import i18n from './config/i18n'
import { usersService } from './src/services/UsersService'

dotenv.config()
const app = express() 

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(i18n.init)

app.use(async(req, res, next) => {
  if (req.headers['authorization']) {
    const accessToken = <string>req.headers['authorization'].replace('Bearer ', '')
    const { userId, exp } = await <jwt.JwtPayload>jwt.verify(accessToken, process.env.JWT_SECRET!)

    if (exp && exp < Date.now().valueOf() / 1000) {
      throw new AppError('Your access token has expired. Please login to obtain a new one.', 401)
    }

    res.locals.loggedInUser = await usersService.getUserById(userId)
  }  

  const whitelist = 'http://localhost:4200'
  res.setHeader('Access-Control-Allow-Origin', whitelist)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Content-Type', 'application/json')
  if (req.method === "OPTIONS") {
    res.setHeader('Access-Control-Allow-Headers', 'access-control-allow-headers,access-control-allow-methods,access-control-allow-origin,authorization,content-type')
    res.status(200).end()
  } else {
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Access-Control-Headers, Access-Control-Request-Method, Access-Control-Request-Headers, Authorization')
    next()
  }
})

app.use(errorHandler)

export default app