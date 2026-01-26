import { Price } from "../Price"

export type AppliedDiscount = {
  discountId?: string | null
  amountOverride?: Price | null
  amountSnapshot?: Price | null
  description?: string | null
}