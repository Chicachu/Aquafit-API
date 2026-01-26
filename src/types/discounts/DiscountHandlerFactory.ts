import { DiscountType } from "../enums/DiscountType";
import { DiscountHandler } from "./DiscountHandler";
import { DiscountContext } from "./handlers/contexts/DiscountContext";
import { FlatDiscountHandler } from "./handlers/FlatDiscountHandler";
import { PartialEnrollmentDiscountHandler } from "./handlers/PartialEnrollmentDiscountHandler";
import { PercentageDiscountHandler } from "./handlers/PercentageDiscountHandler";
import { BogoClassDiscountHandler } from "./handlers/BogoClassDiscountHandler";
import { BogoPersonDiscountHandler } from "./handlers/BogoPersonDiscountHandler";

export class DiscountHandlerFactory {
  static getHandler(type: DiscountType.FLAT): FlatDiscountHandler;
  static getHandler(type: DiscountType.PARTIAL_ENROLLMENT): PartialEnrollmentDiscountHandler;
  static getHandler(type: DiscountType.PERCENTAGE): PercentageDiscountHandler;
  static getHandler(type: DiscountType.BOGO_CLASS): BogoClassDiscountHandler;
  static getHandler(type: DiscountType.BOGO_PERSON): BogoPersonDiscountHandler;
  static getHandler(type: DiscountType): DiscountHandler<DiscountContext> | null;
  static getHandler(type: DiscountType): DiscountHandler<DiscountContext> | null {
    switch(type) {
      case DiscountType.FLAT: 
        return new FlatDiscountHandler()
      case DiscountType.PARTIAL_ENROLLMENT: 
        return new PartialEnrollmentDiscountHandler()
      case DiscountType.PERCENTAGE:
        return new PercentageDiscountHandler()
      case DiscountType.BOGO_CLASS:
        return new BogoClassDiscountHandler()
      case DiscountType.BOGO_PERSON:
        return new BogoPersonDiscountHandler()
      default:
        return null;
    }
  }
}