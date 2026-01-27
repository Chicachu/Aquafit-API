import path from "path"
import { logger } from "./LoggingService"
import cron from 'node-cron'
import { invoiceCollection } from "../models/invoice/invoice.class"
import { clientHandler } from "../business/ClientHandler"

export class CronSchedulerService {
  static async startAllJobs() {
    logger.debugInside(path.basename(__filename), this.startAllJobs.name)
    
    // Run immediately on startup
    try {
      logger.debugInside('', '[STARTUP] Running updateInvoiceStatuses on startup...')
      await invoiceCollection.updatePaymentStatuses()
      logger.debugInside('', '[STARTUP] Completed updateInvoiceStatuses')
    } catch (error: any) {
      logger.error(`[STARTUP] Error in updateInvoiceStatuses: ${error?.message || error}`)
    }

    try {
      logger.debugInside('', '[STARTUP] Running processDueDateCheckAndCreateInvoices on startup...')
      await clientHandler.processDueDateCheckAndCreateInvoices()
      logger.debugInside('', '[STARTUP] Completed processDueDateCheckAndCreateInvoices')
    } catch (error: any) {
      logger.error(`[STARTUP] Error in processDueDateCheckAndCreateInvoices: ${error?.message || error}`)
    }

    // Schedule to run every midnight
    cron.schedule('0 0 * * *', async () => {
      try {
        logger.debugInside('', '[CRON] Running updateInvoiceStatuses...')
        await invoiceCollection.updatePaymentStatuses()
        logger.debugInside('', '[CRON] Completed updateInvoiceStatuses')
      } catch (error: any) {
        logger.error(`[CRON] Error in updateInvoiceStatuses: ${error?.message || error}`)
      }
    })

    cron.schedule('0 0 * * *', async () => {
      try {
        logger.debugInside('', '[CRON] Running processDueDateCheckAndCreateInvoices...')
        await clientHandler.processDueDateCheckAndCreateInvoices()
        logger.debugInside('', '[CRON] Completed processDueDateCheckAndCreateInvoices')
      } catch (error: any) {
        logger.error(`[CRON] Error in processDueDateCheckAndCreateInvoices: ${error?.message || error}`)
      }
    })
  }
}