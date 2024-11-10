import express from 'express';
import { languageController } from '../controllers/LanguageController';

const router = express.Router();

router.post('/language', languageController.setLanguage);

export default router;