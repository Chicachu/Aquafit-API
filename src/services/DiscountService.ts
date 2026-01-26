import path from "path";
import AppError from "../types/AppError";
import { Discount } from "../types/discounts/Discount";
import { DiscountHandlerFactory } from "../types/discounts/DiscountHandlerFactory";
import { DiscountContext } from "../types/discounts/handlers/contexts/DiscountContext";
import { Currency } from "../types/enums/Currency";
import { DiscountCollection, discountCollection } from "../models/discount/discount.class";
import { logger } from "./LoggingService";

class DiscountService {
  constructor(private discountCollection: DiscountCollection) {
    this.discountCollection = discountCollection
  }

  private readonly _FILE_NAME = path.basename(__filename)

  async getAllDiscounts(): Promise<Discount[]> {
    logger.debugInside(this._FILE_NAME, this.getAllDiscounts.name)
    return await this.discountCollection.find()
  }

  async getDiscount(discountId: string): Promise<Discount> {
    logger.debugInside(this._FILE_NAME, this.getDiscount.name, { discountId })
    const discount = await this.discountCollection.getDiscountById(discountId)
    
    if (!discount) {
      throw new AppError('errors.resourceNotFound', 404)
    }

    return discount
  }

  async applyDiscountToInvoice<TContext extends DiscountContext = DiscountContext>(
    discount: Discount,
    chargeAmount: number,
    currency: Currency,
    context?: TContext
  ): Promise<{}> {
    const handler = DiscountHandlerFactory.getHandler(discount.type)

    if (!handler) throw new AppError('', 400)

    const calculatedAmount = handler.apply(chargeAmount, discount, context)
  
    return {
      discountId: discount._id,
      amountSnapshot: {
        amount: calculatedAmount,
        currency
      },
      description: discount.description
    }
  }
}

const discountService = new DiscountService(discountCollection)
export { discountService, DiscountService }