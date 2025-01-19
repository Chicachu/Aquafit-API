import { IDocument } from "./IDocument";
import { Price } from "./Price";
import { User } from "./User";
import { ClassType } from "./enums/ClassType";
import { Currency } from "./enums/Currency";
import { Weekday } from "./enums/Weekday";

export type Class = IDocument & {
  classLocation: string
  classType: ClassType
  days: Weekday[]
  startDate: Date
  endDate?: Date | null
  startTime: string
  prices: Price[]
  maxCapacity: number
  checkIns?: {
    date: Date
    instructorId: string
    clientIds: string[]
  }[]
  cancellations?: {
    date: Date
    instructorId: string
    reason: string
  }[]
  waitlist?: string[] | undefined
}

export type ClassCreationDTO = {
  classLocation: string
  days: Weekday[]
  startDate: Date
  startTime: string
  prices: Price[]
  maxCapacity: number
}

export type ClassUpdateOptions = {
  days?: Weekday[]
  classLocation?: string
  startTime?: string
  prices?: Price[] 
  maxCapacity?: number 
}