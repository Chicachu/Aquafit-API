import path from "path"
import { logger } from "./LoggingService"
import cron from 'node-cron'
import { invoiceCollection } from "../models/invoice/invoice.class"

export class CronSchedulerService {
  static startAllJobs() {
    logger.debugInside(path.basename(__filename), this.startAllJobs.name)
    
    cron.schedule('0 0 * * *', async () => {
      logger.debugInside('', '[CRON] Running updateInvoiceStatuses...')
      await invoiceCollection.updatePaymentStatuses()
    })
  }
}