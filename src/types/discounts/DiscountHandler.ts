import { Discount } from "./Discount";
import { DiscountContext } from "./handlers/contexts/DiscountContext";

export interface DiscountHandler<TContext extends DiscountContext = DiscountContext> {
  apply(chargeAmount: number, discount: Discount, context?: TContext): number;
}
