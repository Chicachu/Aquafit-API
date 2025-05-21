import express from 'express'
import { enrollmentCotroller } from '../controllers/EnrollmentController'

const router = express.Router()

router.post('/', enrollmentCotroller.enrollClient)