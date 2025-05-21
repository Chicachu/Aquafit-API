import { Promotion } from "../Discount";
import { DiscountHandler } from "../DiscountHandler";

export class FlatDiscountHandler implements DiscountHandler {
  apply(_: number, discount: Promotion): number {
    return discount.amount;
  }
}