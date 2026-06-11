import express from 'express'
import { invoiceAndPaymentsController } from '../controllers/InvoiceAndPaymentsController'
import { hasAccess, isLoggedIn, hasAccessToUserInvoices } from '../middleware/AuthMiddleware'
import { AccessControlResource } from '../types/enums/AccessControlResource'
import { AccessControlAction } from '../types/enums/AccessControlAction'

const router = express.Router()

router.get(
  '/:userId/invoices',
  isLoggedIn,
  hasAccessToUserInvoices,
  invoiceAndPaymentsController.getInvoicesByUserId
)

router.get(
  '/:userId/payments/:enrollmentId',
  isLoggedIn,
  hasAccess(AccessControlAction.READ_ANY, AccessControlResource.PAYMENT),
  invoiceAndPaymentsController.getInvoiceHistory
)

router.get(
  '/:userId/payments/:enrollmentId/:invoiceId',
  isLoggedIn,
  hasAccess(AccessControlAction.READ_ANY, AccessControlResource.PAYMENT),
  invoiceAndPaymentsController.getInvoiceDetails
)

router.post(
  '/:userId/payments/:enrollmentId/:invoiceId/apply',
  isLoggedIn,
  hasAccess(AccessControlAction.CREATE_ANY, AccessControlResource.PAYMENT),
  invoiceAndPaymentsController.applyPaymentToInvoice
)

router.get(
  '/:userId/payables/:payableId',
  isLoggedIn,
  hasAccessToUserInvoices,
  ...invoiceAndPaymentsController.getPayableDetails
)

export default router
