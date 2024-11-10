import { Currency } from "./enums/Currency"
import { Role } from "./enums/Role"
import { IDocument } from "./IDocument"

export type User = IDocument & {
  firstName: string
  lastName: string
  phoneNumber: string
  role: Role
  username?: string | null
  password?: string | null
  credits?: {
    amount: number
    currency: Currency
  } | null
  accessToken?: string | null
}

export type UserCreationDTO = {
  firstName: string
  lastName: string
  phoneNumber: string
  role: Role
}

export type UpdateUserOptions = {
  phoneNumber?: string
  username?: string
  password?: string
  accessToken?: string
}