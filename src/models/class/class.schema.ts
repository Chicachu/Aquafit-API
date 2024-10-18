import { InferSchemaType, Model, Schema, model } from "mongoose"
import { Currency } from "../../types/enums/Currency"
import { Weekday } from "../../types/enums/Weekday"

const ClassSchema = new Schema(
  {
    _id: String,
    classLocation: {
      type: String,
      enum: Object.values(Location),
      required: true
    },
    days: [{
      type: String,
      enum: Object.values(Weekday),
      required: true
    }], 
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    startTime: {
      type: String, // "14:30" = 2:30
      required: true
    },
    prices: {
      type: Map,
      of: new Schema({
        value: {
          type: Number,
          required: true
        }
      }),
      required: true,
      validate: {
        validator: function (v: Map<string, { value: number }>) {
          const allowedCurrencies = Object.values(Currency)
          const keys = Array.from(v.keys())
          return keys.every(key => allowedCurrencies.includes(key as Currency))
        },
        message: (props: { value: string }) => `${props.value} is not a valid currency!`
      }
    },
    maxAttendees: {
      type: Number,
      required: true
    },
  },
  { timestamps: true }
)

ClassSchema.index({ days: 1, startTime: 1 })

type ClassDocument = InferSchemaType<typeof ClassSchema>

interface IClassDocument extends ClassDocument, Document { }
interface IClassModel extends Model<IClassDocument> { }

const ClassModel = model<IClassModel>('Class', ClassSchema)

export { ClassSchema, ClassDocument, IClassModel, ClassModel }