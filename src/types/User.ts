import { Currency } from "./enums/Currency"
import { Role } from "./enums/Role"
import { IDocument } from "./IDocument"

export type User = IDocument & {
  firstName: string
  lastName: string
  phoneNumber: string
  role: Role
  email?: string
  username?: string
  password?: string
  credits?: {
    amount: number
    currency: Currency
  }
  accessToken?: string
}