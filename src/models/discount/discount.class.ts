import { Model } from "mongoose"
import Collection from "../_common/collection.class"
import { DiscountModel, IDiscountDocument, IDiscountModel } from "./discount.schema"

class DiscountCollection extends Collection<IDiscountDocument> {
  constructor(model: Model<IDiscountModel>) {
    super(model)
  }

  async getDiscountById(discountId: string): Promise<IDiscountDocument> {
    return await this.findOne({ _id: discountId })
  }
}

const discountCollection = new DiscountCollection(DiscountModel)
export { discountCollection, DiscountCollection }