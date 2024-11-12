import { IDocument } from "./IDocument";
import { Currency } from "./enums/Currency";
import { Weekday } from "./enums/Weekday";

export type Class = IDocument & {
  classLocation: string
  days: Weekday[]
  startDate: Date
  endDate?: Date | null
  startTime: string
  prices: Map<Currency | string, number>
  maxCapacity: number
  checkIns: {
    date: Date
    instructorId: string
    clientIds: string[]
  }[]
  cancellations: {
    date: Date
    instructorId: string
    reason: string
  }[]
}

export type ClassCreationDTO = {
  classLocation: string
  days: Weekday[]
  startDate: Date
  startTime: string
  prices: Map<Currency | string, number>
  maxCapacity: number
}

export type ClassUpdateOptions = {
  days?: Weekday[]
  classLocation?: string
  startTime?: string
  prices?: Map<Currency | string, number> 
  maxCapacity?: number 
}