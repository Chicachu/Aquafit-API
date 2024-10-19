import express from "express";
import { usersController } from "../controllers/UsersController";
import { hasAccess } from "../middleware/AuthMiddleware";
import { AccessControlResource } from "../types/enums/AccessControlResource";
import { AccessControlAction } from "../types/enums/AccessControlAction";

const router = express.Router()

router.get('/', hasAccess(AccessControlAction.READ_ANY, AccessControlResource.USER), usersController.getAllUsers)
router.get('/register', usersController.registerNewUser)

export default router