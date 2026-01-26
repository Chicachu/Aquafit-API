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

  async createDiscount(discountData: {
    description: string
    type: string
    amount?: number
    period?: { startDate: Date, endDate?: Date }
  }): Promise<Discount> {
    logger.debugInside(this._FILE_NAME, this.createDiscount.name, { discountData })
    
    // Amount is required in schema, default to 0 if not provided (for discount types that don't use it)
    const discountToCreate = {
      description: discountData.description,
      type: discountData.type,
      amount: discountData.amount ?? 0,
      startDate: discountData.period?.startDate || new Date(),
      endDate: discountData.period?.endDate
    }

    return await this.discountCollection.insertOne(discountToCreate)
  }

  async updateDiscount(discountId: string, discountData: {
    description?: string
    type?: string
    amount?: number
    period?: { startDate: Date, endDate?: Date }
  }): Promise<Discount> {
    logger.debugInside(this._FILE_NAME, this.updateDiscount.name, { discountId, discountData })
    
    const discount = await this.discountCollection.getDiscountById(discountId)
    
    if (!discount) {
      throw new AppError('errors.resourceNotFound', 404)
    }

    const updateData: any = {}
    if (discountData.description !== undefined) updateData.description = discountData.description
    if (discountData.type !== undefined) updateData.type = discountData.type
    if (discountData.amount !== undefined) updateData.amount = discountData.amount
    if (discountData.period?.startDate !== undefined) updateData.startDate = discountData.period.startDate
    if (discountData.period?.endDate !== undefined) updateData.endDate = discountData.period.endDate
    else if (discountData.period && discountData.period.endDate === null) updateData.endDate = null

    return await this.discountCollection.updateOne({ _id: discountId }, updateData)
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