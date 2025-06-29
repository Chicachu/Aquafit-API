import express from "express";
import { usersController } from "../controllers/UsersController";
import { hasAccess, isLoggedIn } from "../middleware/AuthMiddleware";
import { AccessControlResource } from "../types/enums/AccessControlResource";
import { AccessControlAction } from "../types/enums/AccessControlAction";

const router = express.Router()

router.get('/', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.USER), usersController.getAllUsers)

router.get('/:userId', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.USER), usersController.getUser)

router.put('/', isLoggedIn, hasAccess(AccessControlAction.CREATE_ANY, AccessControlResource.USER), usersController.addNewUser)

router.post('/register', usersController.registerNewUser)

router.get('/:userId/enrollments', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.ENROLLMENT), usersController.getClientEnrollmentDetails)

router.get('/:userId/payments/:enrollmentId', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.PAYMENT), usersController.getInvoiceHistory)

router.get('/:userId/payments/:enrollmentId/:invoiceId', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.PAYMENT), usersController.getInvoiceDetails)

export default router