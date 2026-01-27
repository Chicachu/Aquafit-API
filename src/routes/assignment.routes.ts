import express from 'express'
import { assignmentController } from '../controllers/AssignmentController'
import { hasAccess, isLoggedIn } from '../middleware/AuthMiddleware'
import { AccessControlResource } from '../types/enums/AccessControlResource'
import { AccessControlAction } from '../types/enums/AccessControlAction'

const router = express.Router()

router.post('/', isLoggedIn, hasAccess(AccessControlAction.CREATE_ANY, AccessControlResource.CLASS), assignmentController.assignInstructor)

router.patch('/:assignmentId', isLoggedIn, hasAccess(AccessControlAction.UPDATE_ANY, AccessControlResource.CLASS), assignmentController.updateAssignment)

router.delete('/:assignmentId', isLoggedIn, hasAccess(AccessControlAction.DELETE_ANY, AccessControlResource.CLASS), assignmentController.unassignInstructor)

export default router
