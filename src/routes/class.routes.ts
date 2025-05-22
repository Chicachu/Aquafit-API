import express from "express";
import { hasAccess, isLoggedIn } from "../middleware/AuthMiddleware";
import { AccessControlAction } from "../types/enums/AccessControlAction";
import { AccessControlResource } from "../types/enums/AccessControlResource";
import { classController } from "../controllers/ClassController";

const router = express.Router()

router.get('/', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.CLASS), classController.getAllClasses)
router.put('/', isLoggedIn, hasAccess(AccessControlAction.CREATE_ANY, AccessControlResource.CLASS), classController.addNewClass)
router.get('/:classId/details', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.ALL), classController.getClassDetails)
router.get('/locations', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.CLASS), classController.getAllLocations)
router.get('/classScheduleMap', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.CLASS), classController.getClassTypeLocationTimeMap)

export default router