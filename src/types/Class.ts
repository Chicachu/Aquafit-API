import { Types } from "mongoose";
import { IDocument } from "./IDocument";
import { Currency } from "./enums/Currency";
import { Weekday } from "./enums/Weekday";

export type Class = IDocument & {
  classLocation: string
  days: Weekday[]
  startDate: Date
  endDate: Date
  startTime: string
  prices: Map<Currency | string, number>
  maxCapacity: number
  checkIns: {
    date: Date
    instructorId: Types.ObjectId
    clientIds: Types.ObjectId[]
  }[]
  cancellations: {
    date: Date
    instructorId: Types.ObjectId
    reason: string
  }[]
}