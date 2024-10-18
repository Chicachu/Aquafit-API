import { Currency } from "./enums/Currency"
import { Role } from "./enums/Role"
import { IDocument } from "./IDocument"

export type User = IDocument & {
  firstName: string
  lastName: string
  phoneNumber: string
  role: Role
  email?: string | null
  username?: string | null
  password?: string | null
  credits?: {
    amount: number
    currency: Currency
  } | null
  accessToken?: string | null
}