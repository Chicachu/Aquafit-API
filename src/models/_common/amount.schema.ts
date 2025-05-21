import { Schema } from "mongoose";
import { Currency } from "../../types/enums/Currency";

export const AmountSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      enum: Object.values(Currency),
      required: true
    }
  },
  { _id: false }
)
