import { locale } from "moment"
import i18n from "../../config/i18n"
import { logger } from "../services/LoggingService"
import { Locale } from "./enums/Locale"
import { objectAsString } from "../services/util"

class AppError extends Error {
  status: number

  constructor(translationKey: string, statusCode: number, details = {}) {
    const translatedMessage = i18n.__(translationKey)

    const englishMessage = i18n.__({ phrase: translationKey, locale: Locale.EN })

    const detailStr = objectAsString(details)

    const fullMessage = detailStr ? `${translatedMessage} (${detailStr})` : translatedMessage
    super(fullMessage)

    this.status = statusCode

    logger.error(englishMessage)
    Error.captureStackTrace(this, this.constructor)
  }
}

export default AppError