import { DiscountContext } from "./DiscountContext";

export type BogoPersonContext = DiscountContext & {
  numberOfPeople: number;
};
