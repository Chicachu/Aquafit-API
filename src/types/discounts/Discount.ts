import { IDocument } from "../IDocument";
import { Period } from "../Period";
import { DiscountType } from "../enums/DiscountType";

export type Discount = IDocument & {
  description: string
  type: DiscountType
  amount?: number
  period?: Period
}