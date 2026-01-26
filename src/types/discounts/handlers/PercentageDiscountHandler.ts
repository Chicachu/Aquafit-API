import AppError from "../../AppError";
import { Discount } from "../Discount";
import { DiscountHandler } from "../DiscountHandler";
import { DiscountContext } from "./contexts/DiscountContext";
import i18n from "../../../../config/i18n";

export class PercentageDiscountHandler implements DiscountHandler<DiscountContext> {
  apply(chargeAmount: number, discount: Discount): number {
    if (!discount.amount) {
      throw new AppError(i18n.__('errors.missingParameters'), 400);
    }

    if (discount.amount < 0 || discount.amount > 100) {
      throw new AppError(i18n.__('errors.invalidPercentage'), 400);
    }

    return Math.round(chargeAmount * (discount.amount / 100));
  }
}
