import { InferSchemaType, Model, Schema, model } from "mongoose";
import { DiscountType } from "../../types/enums/DiscountType";

const DiscountSchema = new Schema(
  {
    _id: {
      type: String, 
      required: true, 
      auto: true
    }, 
    description: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: Object.values(DiscountType),
      required: true
    },
    amount: {
      type: Number, 
      required: true
    },
    startDate: {
      type: Date,
      required: true
    }, 
    endDate: {
      type: Date, 
      required: false
    }
  },
  { timestamps: true }
)

type DiscountDocument = InferSchemaType<typeof DiscountSchema>

interface IDiscountDocument extends DiscountDocument, Document { }
interface IDiscountModel extends Model<IDiscountDocument> { } 

const DiscountModel = model<IDiscountModel>('Discount', DiscountSchema)

export { DiscountSchema, DiscountDocument, IDiscountDocument, IDiscountModel, DiscountModel }