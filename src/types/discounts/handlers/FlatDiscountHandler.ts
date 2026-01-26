import { Discount } from "../Discount";
import { DiscountHandler } from "../DiscountHandler";
import { DiscountContext } from "./contexts/DiscountContext";

export class FlatDiscountHandler implements DiscountHandler<DiscountContext> {
  apply(_: number, discount: Discount): number {
    return discount.amount ?? 0;
  }
}