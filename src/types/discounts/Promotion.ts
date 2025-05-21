import { IDocument } from "../IDocument";
import { DiscountType } from "../enums/DiscountType";

export type Promotion = IDocument & {
  description: string
  type: DiscountType
  amount: number
  startDate: Date
}