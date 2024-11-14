import express from "express";
import { hasAccess, isLoggedIn } from "../middleware/AuthMiddleware";
import { AccessControlAction } from "../types/enums/AccessControlAction";
import { AccessControlResource } from "../types/enums/AccessControlResource";
import { classController } from "../controllers/ClassController";

const router = express.Router()

router.get('/', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.CLASS), classController.getAllClasses)

export default router