import { Promotion } from "./Promotion";

export interface DiscountHandler {
  apply(chargeAmount: number, discount: Promotion, context?: any): number;
}
