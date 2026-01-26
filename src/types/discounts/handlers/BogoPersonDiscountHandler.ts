import AppError from "../../AppError";
import { Discount } from "../Discount";
import { DiscountHandler } from "../DiscountHandler";
import { BogoPersonContext } from "./contexts/BogoPersonContext";
import i18n from "../../../../config/i18n";

export class BogoPersonDiscountHandler implements DiscountHandler<BogoPersonContext> {
  apply(chargeAmount: number, discount: Discount, context?: BogoPersonContext): number {
    if (!context) {
      throw new AppError(i18n.__('errors.contextMissing'), 404);
    }

    if (context.numberOfPeople < 2) {
      return 0;
    }

    const pairs = Math.floor(context.numberOfPeople / 2);
    const discountPerPerson = chargeAmount / context.numberOfPeople;
    
    return Math.round(discountPerPerson * pairs);
  }
}
