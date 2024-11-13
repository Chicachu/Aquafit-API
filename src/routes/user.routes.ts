import express from "express";
import { usersController } from "../controllers/UsersController";
import { hasAccess, isLoggedIn } from "../middleware/AuthMiddleware";
import { AccessControlResource } from "../types/enums/AccessControlResource";
import { AccessControlAction } from "../types/enums/AccessControlAction";

const router = express.Router()

router.get('/', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.USER), usersController.getAllUsers)
router.post('/register', usersController.registerNewUser)

export default router