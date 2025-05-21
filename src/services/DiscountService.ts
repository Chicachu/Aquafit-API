import AppError from "../types/AppError";
import { DiscountHandlerFactory } from "../types/discounts/DiscountHandlerFactory";
import { Promotion } from "../types/discounts/Promotion";
import { Currency } from "../types/enums/Currency";

class DiscountService {
  async applyDiscountToPayment(
    discount: Promotion,
    chargeAmount: number,
    currency: Currency,
    context?: any
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

const discountService = new DiscountService()
export { discountService, DiscountService }