import express from "express";
import { scheduleController } from "../controllers/ScheduleController";


const router = express.Router()

router.get('/classes', scheduleController.getClassSchedule)

export default router