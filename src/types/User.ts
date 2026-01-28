import { Currency } from "./enums/Currency"
import { Role } from "./enums/Role"
import { IDocument } from "./IDocument"

export type Note = {
  _id: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export type User = IDocument & {
  firstName: string
  lastName: string
  phoneNumber?: string | null
  role: Role
  username?: string | null
  password?: string | null
  credits?: {
    amount: number
    currency: Currency
  } | null
  accessToken?: string | null
  notes?: Note[] | null
  employeeId?: number | null
}

export type UserCreationDTO = {
  firstName: string
  lastName: string
  phoneNumber?: string
  role: Role
  employeeId?: number
}

export type UpdateUserOptions = {
  firstName?: string
  lastName?: string
  phoneNumber?: string
  username?: string
  password?: string
  accessToken?: string
  credits?: {
    amount: number
    currency: Currency
  } | null
  role?: Role
  employeeId?: number | null
}