import express from "express";
import { checkInController } from "../controllers/CheckInController";
import { isLoggedIn } from "../middleware/AuthMiddleware";

const router = express.Router();

router.post("/", isLoggedIn, ...checkInController.createEntry);
router.get("/my-entries", isLoggedIn, checkInController.getMyEntries);

export default router;
