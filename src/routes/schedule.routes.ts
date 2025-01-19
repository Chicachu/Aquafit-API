import express from "express";
import { scheduleController } from "../controllers/ScheduleController";
import { hasAccess, isLoggedIn } from "../middleware/AuthMiddleware";
import { AccessControlAction } from "../types/enums/AccessControlAction";
import { AccessControlResource } from "../types/enums/AccessControlResource";


const router = express.Router()

router.get('/classes', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.CLASS), scheduleController.getClassSchedule)

export default router