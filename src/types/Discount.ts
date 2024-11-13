import { IDocument } from "./IDocument";
import { DiscountType } from "./enums/DiscountType";

export type Discount = IDocument & {
  description: string
  type: DiscountType
  value: number
  startDate: Date
}