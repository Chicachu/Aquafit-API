import AppError from "../../AppError";
import { Discount } from "../Discount";
import { DiscountHandler } from "../DiscountHandler";
import { BogoClassContext } from "./contexts/BogoClassContext";
import i18n from "../../../../config/i18n";

export class BogoClassDiscountHandler implements DiscountHandler<BogoClassContext> {
  apply(chargeAmount: number, discount: Discount, context?: BogoClassContext): number {
    if (!context) {
      throw new AppError(i18n.__('errors.contextMissing'), 404);
    }

    if (context.numberOfClasses < 2) {
      return 0;
    }

    const pairs = Math.floor(context.numberOfClasses / 2);
    const discountPerClass = chargeAmount / context.numberOfClasses;
    
    return Math.round(discountPerClass * pairs);
  }
}
