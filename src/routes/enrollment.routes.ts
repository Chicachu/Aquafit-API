import express from 'express'
import { enrollmentCotroller } from '../controllers/EnrollmentController'
import { hasAccess, isLoggedIn } from '../middleware/AuthMiddleware'
import { AccessControlResource } from '../types/enums/AccessControlResource'
import { AccessControlAction } from '../types/enums/AccessControlAction'

const router = express.Router()

router.post('/', isLoggedIn, hasAccess(AccessControlAction.CREATE_ANY, AccessControlResource.ENROLLMENT), enrollmentCotroller.enrollClient)

export default router