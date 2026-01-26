import AppError from "../../AppError";
import { Discount } from "../Discount";
import { DiscountHandler } from "../DiscountHandler"; 
import { PartialEnrollmentContext } from "./contexts/PartialEnrollmentContext";

export class PartialEnrollmentDiscountHandler implements DiscountHandler<PartialEnrollmentContext> {
  apply(chargeAmount: number, discount: Discount, context?: PartialEnrollmentContext): number {
    if (!context) throw new AppError(i18n.__('errors.contextMissing'), 404)

    const ratio = context.daysAttending / context.totalDaysInClass
    return Math.round(chargeAmount * (1 - ratio))
  }
}