import express from "express";
import { waitlistController } from "../controllers/WaitlistController";
import { isLoggedIn } from "../middleware/AuthMiddleware";

const router = express.Router();

router.post("/", isLoggedIn, ...waitlistController.addWaitlistEntry);
router.get("/", isLoggedIn, waitlistController.getAllWaitlistEntries);
router.delete("/", isLoggedIn, ...waitlistController.removeWaitlistEntry);

export default router;
