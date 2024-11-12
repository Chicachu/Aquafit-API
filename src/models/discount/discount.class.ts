import { Model } from "mongoose"
import Collection from "../_common/collection.class"
import { DiscountModel, IDiscountDocument, IDiscountModel } from "./discount.schema"

class DiscountCollection extends Collection<IDiscountDocument> {
  constructor(model: Model<IDiscountModel>) {
    super(model)
  }

}

const discountCollection = new DiscountCollection(DiscountModel)
export { discountCollection, DiscountCollection }