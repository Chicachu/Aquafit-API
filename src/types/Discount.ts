import { IDocument } from "./IDocument";

export type Discount = IDocument & {
  name: string
  type: Discount
  value: number
  startDate: Date
}