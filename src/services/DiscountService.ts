import AppError from "../types/AppError";
import { Discount } from "../types/discounts/Discount";
import { DiscountHandlerFactory } from "../types/discounts/DiscountHandlerFactory";
import { DiscountContext } from "../types/discounts/handlers/contexts/DiscountContext";
import { Currency } from "../types/enums/Currency";

class DiscountService {
  async applyDiscountToInvoice<TContext>(
    discount: Discount,
    chargeAmount: number,
    currency: Currency,
    context?: TContext
  ): Promise<{}> {
    const handler = DiscountHandlerFactory.getHandler(discount.type)

    if (!handler) throw new AppError('', 400)

    const calculatedAmount = handler.apply(chargeAmount, discount, context as TContext)
  
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