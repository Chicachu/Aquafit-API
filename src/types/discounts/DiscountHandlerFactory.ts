import { DiscountType } from "../enums/DiscountType";
import { DiscountHandler } from "./DiscountHandler";
import { DiscountContext } from "./handlers/contexts/DiscountContext";
import { FlatDiscountHandler } from "./handlers/FlatDiscountHandler";
import { PartialEnrollmentDiscountHandler } from "./handlers/PartialEnrollmentDiscountHandler";
import { PartialEnrollmentContext } from "./handlers/contexts/PartialEnrollmentContext";

export class DiscountHandlerFactory {
  static getHandler(type: DiscountType.FLAT): FlatDiscountHandler;
  static getHandler(type: DiscountType.PARTIAL_ENROLLMENT): PartialEnrollmentDiscountHandler;
  static getHandler(type: DiscountType): DiscountHandler<DiscountContext> | null;
  static getHandler(type: DiscountType): DiscountHandler<DiscountContext> | null {
    switch(type) {
      case DiscountType.FLAT: 
        return new FlatDiscountHandler()
      case DiscountType.PARTIAL_ENROLLMENT: 
        return new PartialEnrollmentDiscountHandler()
      default:
        return null;
    }
  }
}