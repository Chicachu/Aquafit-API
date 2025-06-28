import asyncHandler from 'express-async-handler'
import { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import AppError from '../types/AppError';

class LanguageController {
  setLanguage = [
    body('language').isString().notEmpty().custom((value) => ['en', 'es'].includes(value)),
    asyncHandler(async (req: Request, res: Response) => {
      const { language } = req.body

      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        throw new AppError('errors.missingParameters', 400)
      }
      
      try {
        i18n.setLocale(language)
        res.status(200).send()
      } catch (error) {
        res.status(400).send()
      }
    })
  ]

  getLanguage = asyncHandler(async (req: Request, res: Response) => {
    try {
      const locale = i18n.getLocale()
      res.send({locale})
    } catch (error) {
      error
    }
  })
}

const languageController = new LanguageController()
export { languageController }