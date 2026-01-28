import { IDocument } from "./IDocument"
import { Price } from "./Price"
import { BillingFrequency } from "./enums/BillingFrequency"
import { ClassType } from "./enums/ClassType"
import { Weekday } from "./enums/Weekday"

import { Note } from "./User"

export type Class = IDocument & {
  classLocation: string
  classType: ClassType
  days: Weekday[]
  startDate: Date
  endDate?: Date | null
  startTime: string
  prices: Price[]
  maxCapacity: number
  billingFrequency: BillingFrequency
  checkIns?: {
    date: Date
    employeeId: string
    clientIds: string[]
  }[]
  cancellations?: {
    date: Date
    employeeId: string
    reason?: string | null
  }[]
  waitlist?: string[] | undefined
  notes?: Note[] | null
}

export type ClassCreationDTO = {
  classLocation: string
  classType: ClassType
  days: Weekday[]
  startDate: Date
  startTime: string
  prices: Price[]
  billingFrequency: BillingFrequency
  maxCapacity: number
}

export type ClassUpdateOptions = {
  days?: Weekday[]
  classLocation?: string
  startTime?: string
  prices?: Price[] 
  maxCapacity?: number
  endDate?: Date | null
  cancellations?: {
    date: Date
    employeeId: string
    reason?: string | null
  }[]
}