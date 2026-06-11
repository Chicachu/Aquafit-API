import dotenv from 'dotenv'
import express from 'express'
import jwt from 'jsonwebtoken'
import { errorHandler } from './src/middleware/ErrorMiddleware'
import AppError from './src/types/AppError'
import i18n from './config/i18n'

// Load .env only in development; production uses platform env vars (e.g. Koyeb)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config()
}
const app = express() 

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.use(i18n.init)

// CORS first so every response (including errors and OPTIONS) can have the header
const getAllowedOrigins = (): string[] => {
  const raw = process.env.FRONTEND_URL ?? ''
  const list = raw
    .split(',')
    .map(u => u.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean)
  return ['http://localhost:4200', ...list]
}

const isOriginAllowed = (origin: string | undefined): boolean => {
  if (!origin) return false
  const allowed = getAllowedOrigins()
  const o = origin.toLowerCase()
  if (allowed.some(a => a.toLowerCase() === o)) return true
  try {
    const host = new URL(origin).hostname.toLowerCase()
    if (host === 'aquafitvallarta.com' || host.endsWith('.aquafitvallarta.com')) return true
  } catch {
    // ignore invalid origin
  }
  return false
}

app.use((req, res, next) => {
  const origin = req.headers.origin as string | undefined
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  res.header('Content-Type', 'application/json')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  next()
})

app.use(async(req, res, next) => {
  if (req.headers['authorization']) {
    const accessToken = <string>req.headers['authorization'].replace('Bearer ', '')
    const { userId, exp } = await <jwt.JwtPayload>jwt.verify(accessToken, process.env.JWT_SECRET!)

    if (exp && exp < Date.now().valueOf() / 1000) {
      throw new AppError('Your access token has expired. Please login to obtain a new one.', 401)
    }

    res.locals.loggedInUser = userId
  }
  next()
})

import languageRouter from './src/routes/language.routes'
app.use('/api/languages', languageRouter)

import authenticationRouter from './src/routes/authentication.routes'
app.use('/api/auth', authenticationRouter)

import usersRouter from './src/routes/user.routes'
app.use('/api/users', usersRouter)

import classRouter from './src/routes/class.routes'
app.use('/api/classes', classRouter)

import scheduleRouter from './src/routes/schedule.routes'
app.use('/api/schedules', scheduleRouter)

import enrollmentRouter from './src/routes/enrollment.routes'
app.use('/api/enrollments', enrollmentRouter)

import invoiceAndPaymentsRouter from './src/routes/invoice-and-payments.routes'
app.use('/api/invoice-and-payments', invoiceAndPaymentsRouter)

import discountRouter from './src/routes/discount.routes'
app.use('/api/discounts', discountRouter)

import assignmentRouter from './src/routes/assignment.routes'
app.use('/api/assignments', assignmentRouter)

import checkInRouter from './src/routes/check-in.routes'
app.use('/api/check-ins', checkInRouter)

import waitlistRouter from './src/routes/waitlist.routes'
app.use('/api/waitlist', waitlistRouter)

app.use(errorHandler)

export default app