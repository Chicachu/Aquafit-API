import express from "express";
import { hasAccess, isLoggedIn, hasAccessToClassNotes, hasAccessToTerminateOrUpdateClass } from "../middleware/AuthMiddleware";
import { AccessControlAction } from "../types/enums/AccessControlAction";
import { AccessControlResource } from "../types/enums/AccessControlResource";
import { classController } from "../controllers/ClassController";

const router = express.Router()

router.get('/', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.CLASS), classController.getAllClasses)
router.put('/', isLoggedIn, hasAccess(AccessControlAction.CREATE_ANY, AccessControlResource.CLASS), classController.addNewClass)
router.get('/:classId/details', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.CLASS), classController.getClassDetails)
router.get('/locations', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.CLASS), classController.getAllLocations)
router.get('/classScheduleMap', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.CLASS), classController.getClassTypeLocationTimeMap)
router.get('/:classId', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.CLASS), ...classController.getClass)
router.put('/:classId', isLoggedIn, hasAccess(AccessControlAction.UPDATE_ANY, AccessControlResource.CLASS), hasAccessToTerminateOrUpdateClass, classController.updateClass)
router.post('/:classId/terminate', isLoggedIn, hasAccess(AccessControlAction.UPDATE_ANY, AccessControlResource.CLASS), hasAccessToTerminateOrUpdateClass, ...classController.terminateClass)
router.post('/:classId/cancel', isLoggedIn, hasAccess(AccessControlAction.UPDATE_ANY, AccessControlResource.CLASS), ...classController.cancelClass)

router.post('/:classId/notes', isLoggedIn, hasAccessToClassNotes, ...classController.addNote)

router.delete('/:classId/notes/:noteId', isLoggedIn, hasAccessToClassNotes, ...classController.deleteNote)

export default router