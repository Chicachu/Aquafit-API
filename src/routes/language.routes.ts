import express from 'express'
import { languageController } from '../controllers/LanguageController'

const router = express.Router()

router.get('/', languageController.getLanguage)
router.post('/', languageController.setLanguage)

export default router