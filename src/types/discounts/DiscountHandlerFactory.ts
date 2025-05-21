import { DiscountType } from "../enums/DiscountType";
import { FlatDiscountHandler } from "./handlers/FlatDiscountHandler";
import { PartialEnrollmentDiscountHandler } from "./handlers/PartialEnrollmentDiscountHandler";

export class DiscountHandlerFactory {
  static getHandler(type: DiscountType) {
    switch(type) {
      case DiscountType.FLAT: 
        return new FlatDiscountHandler()
      case DiscountType.PARTIAL_ENROLLMENT: 
        return new PartialEnrollmentDiscountHandler()
    }
  }
}