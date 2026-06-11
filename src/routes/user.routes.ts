import express from "express";
import { usersController } from "../controllers/UsersController";
import { hasAccess, isLoggedIn } from "../middleware/AuthMiddleware";
import { AccessControlResource } from "../types/enums/AccessControlResource";
import { AccessControlAction } from "../types/enums/AccessControlAction";

const router = express.Router()

router.get('/', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.USER), usersController.getAllUsers)

router.get('/next-employee-id', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.USER), usersController.getNextEmployeeId)

router.get('/lookup-by-name', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.USER), ...usersController.lookupByFirstNameAndLastName)

router.get('/:userId/can-delete', isLoggedIn, hasAccess(AccessControlAction.DELETE_ANY, AccessControlResource.USER), ...usersController.getCanDeleteUser)

router.get('/:userId', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.USER), usersController.getUser)

router.put('/', isLoggedIn, hasAccess(AccessControlAction.CREATE_ANY, AccessControlResource.USER), usersController.addNewUser)

router.post('/register', usersController.registerNewUser)

router.put('/:userId', isLoggedIn, hasAccess(AccessControlAction.UPDATE_ANY, AccessControlResource.USER), usersController.updateClient)

router.post('/:userId/notes', isLoggedIn, hasAccess(AccessControlAction.UPDATE_ANY, AccessControlResource.USER), usersController.addNote)

router.delete('/:userId/notes/:noteId', isLoggedIn, hasAccess(AccessControlAction.UPDATE_ANY, AccessControlResource.USER), usersController.deleteNote)

router.delete('/:userId', isLoggedIn, hasAccess(AccessControlAction.DELETE_ANY, AccessControlResource.USER), ...usersController.deleteUser)

export default router