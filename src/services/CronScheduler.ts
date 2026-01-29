/**
 * Cron runs at midnight and on startup. Three jobs check endDates and update status:
 * - Classes: endDate passed → 'terminated'; enrollments → 'terminated'; refunds for remaining sessions (ClassHandler.terminateClass).
 * - Enrollments: endDate passed → 'unenrolled'.
 * - Assignments: endDate passed → 'unassigned'.
 */
import path from "path"
import { logger } from "./LoggingService"
import cron from 'node-cron'
import { invoiceCollection } from "../models/invoice/invoice.class"
import { clientHandler } from "../business/ClientHandler"
import { classHandler } from "../business/ClassHandler"
import { classService } from "./ClassService"
import { enrollmentService } from "./EnrollmentService"
import { assignmentService } from "./AssignmentService"
import * as employeePayableService from "./EmployeePayableService"

export class CronSchedulerService {
  static async startAllJobs() {
    logger.debugInside(path.basename(__filename), this.startAllJobs.name)

    // Run immediately on startup so state is correct after every server restart
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

    try {
      logger.debugInside('', '[STARTUP] Running class termination (status, enrollments, refunds)...')
      const toTerminate = await classService.getClassesWithEndDatePassed()
      for (const c of toTerminate) {
        await classHandler.terminateClass(c._id!, c.endDate!)
      }
      logger.debugInside('', '[STARTUP] Completed class termination', { count: toTerminate.length })
    } catch (error: any) {
      logger.error(`[STARTUP] Error in class termination: ${error?.message || error}`)
    }

    try {
      logger.debugInside('', '[STARTUP] Running updateEnrollmentStatuses on startup...')
      await enrollmentService.updateEnrollmentStatuses()
      logger.debugInside('', '[STARTUP] Completed updateEnrollmentStatuses')
    } catch (error: any) {
      logger.error(`[STARTUP] Error in updateEnrollmentStatuses: ${error?.message || error}`)
    }

    try {
      logger.debugInside('', '[STARTUP] Running generatePayablesForCurrentMonth on startup...')
      await employeePayableService.generatePayablesForCurrentMonth()
      logger.debugInside('', '[STARTUP] Completed generatePayablesForCurrentMonth')
    } catch (error: any) {
      logger.error(`[STARTUP] Error in generatePayablesForCurrentMonth: ${error?.message || error}`)
    }

    try {
      logger.debugInside('', '[STARTUP] Running updateAssignmentStatuses on startup...')
      const { modifiedCount } = await assignmentService.updateAssignmentStatuses()
      logger.debugInside('', '[STARTUP] Completed updateAssignmentStatuses', { modifiedCount })
    } catch (error: any) {
      logger.error(`[STARTUP] Error in updateAssignmentStatuses: ${error?.message || error}`)
    }

    // Schedule to run every midnight (payables, invoices, enrollments, assignments)
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

    cron.schedule('0 0 * * *', async () => {
      try {
        logger.debugInside('', '[CRON] Running class termination (status, enrollments, refunds)...')
        const toTerminate = await classService.getClassesWithEndDatePassed()
        for (const c of toTerminate) {
          await classHandler.terminateClass(c._id!, c.endDate!)
        }
        logger.debugInside('', '[CRON] Completed class termination', { count: toTerminate.length })
      } catch (error: any) {
        logger.error(`[CRON] Error in class termination: ${error?.message || error}`)
      }
    })

    cron.schedule('0 0 * * *', async () => {
      try {
        logger.debugInside('', '[CRON] Running updateEnrollmentStatuses...')
        await enrollmentService.updateEnrollmentStatuses()
        logger.debugInside('', '[CRON] Completed updateEnrollmentStatuses')
      } catch (error: any) {
        logger.error(`[CRON] Error in updateEnrollmentStatuses: ${error?.message || error}`)
      }
    })

    cron.schedule('0 0 * * *', async () => {
      try {
        logger.debugInside('', '[CRON] Running generatePayablesForCurrentMonth...')
        await employeePayableService.generatePayablesForCurrentMonth()
        logger.debugInside('', '[CRON] Completed generatePayablesForCurrentMonth')
      } catch (error: any) {
        logger.error(`[CRON] Error in generatePayablesForCurrentMonth: ${error?.message || error}`)
      }
    })

    cron.schedule('0 0 * * *', async () => {
      try {
        logger.debugInside('', '[CRON] Running updateAssignmentStatuses...')
        await assignmentService.updateAssignmentStatuses()
        logger.debugInside('', '[CRON] Completed updateAssignmentStatuses')
      } catch (error: any) {
        logger.error(`[CRON] Error in updateAssignmentStatuses: ${error?.message || error}`)
      }
    })
  }
}