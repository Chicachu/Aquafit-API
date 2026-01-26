import express from "express";
import { hasAccess, isLoggedIn } from "../middleware/AuthMiddleware";
import { AccessControlAction } from "../types/enums/AccessControlAction";
import { AccessControlResource } from "../types/enums/AccessControlResource";
import { discountController } from "../controllers/DiscountController";

const router = express.Router()

router.get('/', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.DISCOUNT), discountController.getAllDiscounts)
router.get('/:discountId', isLoggedIn, hasAccess(AccessControlAction.READ_ANY, AccessControlResource.DISCOUNT), discountController.getDiscount)
router.post('/', isLoggedIn, hasAccess(AccessControlAction.CREATE_ANY, AccessControlResource.DISCOUNT), discountController.createDiscount)
router.put('/:discountId', isLoggedIn, hasAccess(AccessControlAction.UPDATE_ANY, AccessControlResource.DISCOUNT), discountController.updateDiscount)

export default router
