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
      // BOGO requires at least 2 classes
      return 0;
    }

    // "2 classes, 1 price" means for every 2 classes, you get 1 free
    // So if chargeAmount is for numberOfClasses, discount is chargeAmount / numberOfClasses * (numberOfClasses / 2)
    // Simplified: for every pair of classes, discount one class worth
    const pairs = Math.floor(context.numberOfClasses / 2);
    const discountPerClass = chargeAmount / context.numberOfClasses;
    
    return Math.round(discountPerClass * pairs);
  }
}
