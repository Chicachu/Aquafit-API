import express from "express";
import { authenticationController } from "../controllers/AuthenticationController";

const router = express.Router()

router.post('/login', authenticationController.login)

export default router