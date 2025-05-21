import AppError from "../../AppError";
import { Promotion } from "../Discount";
import { DiscountHandler } from "../DiscountHandler";

export class PartialEnrollmentDiscountHandler implements DiscountHandler {
  apply(chargeAmount: number, discount: Promotion, context?: {daysAttending: number, totalDaysInClass: number}): number {
    if (!context) throw new AppError(i18n.__('errors.contextMissing'), 404)

    const ratio = context.daysAttending / context.totalDaysInClass
    return Math.round(chargeAmount * (1 - ratio))
  }
}