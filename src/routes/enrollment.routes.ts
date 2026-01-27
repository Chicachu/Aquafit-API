import express from 'express'
import { enrollmentCotroller } from '../controllers/EnrollmentController'
import { hasAccess, isLoggedIn } from '../middleware/AuthMiddleware'
import { AccessControlResource } from '../types/enums/AccessControlResource'
import { AccessControlAction } from '../types/enums/AccessControlAction'

const router = express.Router()

router.post('/', isLoggedIn, hasAccess(AccessControlAction.CREATE_ANY, AccessControlResource.ENROLLMENT), enrollmentCotroller.enrollClient)

router.get('/active', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.ENROLLMENT), enrollmentCotroller.getAllActiveEnrollments)

router.post('/unenroll', isLoggedIn, hasAccess(AccessControlAction.UPDATE_ANY, AccessControlResource.ENROLLMENT), enrollmentCotroller.unenrollClient)

export default router