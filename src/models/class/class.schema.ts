import { InferSchemaType, Model, Schema, model } from "mongoose"
import { Currency } from "../../types/enums/Currency"
import { Weekday } from "../../types/enums/Weekday"
import { IUserDocument, UserModel } from "../user/user.schema"
import { Role } from "../../types/enums/Role"

const ClassSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true 
    },
    classLocation: {
      type: String,
      required: true
    },
    days: {
      type: [Number],
      enum: Object.values(Weekday),
      required: true
    }, 
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
      of: Number, 
      required: true,
      validate: {
        validator: function (v: Map<Currency, number>) {
          const allowedCurrencies = Object.values(Currency);
          const keys = Array.from(v.keys());
          return keys.every(key => allowedCurrencies.includes(key as Currency));
        },
        message: (props: { value: string }) => `${props.value} is not a valid currency!`
      }
    },
    maxCapacity: {
      type: Number,
      required: true
    },
    checkIns: [{
      date: {
        type: Date, 
        required: true
      },
      instructorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        validate: {
          validator: async function (instructorId: Schema.Types.ObjectId) {
            const user = await UserModel.findById(instructorId).lean() as IUserDocument | null
            return user && user.role === Role.INSTRUCTOR 
          },
          message: 'Assigned user must have the role of instructor.'
        }
      }, 
      clientIds: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }]
    }],
    cancellations: [{
      date: {
        type: Date, 
        required: true
      },
      instructorId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        validate: {
          validator: async function (instructorId: Schema.Types.ObjectId) {
            const user = await UserModel.findById(instructorId).lean() as IUserDocument | null
            return user && user.role === Role.INSTRUCTOR 
          },
          message: 'Assigned user must have the role of instructor.'
        }
      }, 
      reason: {
        type: String, 
        required: true
      }
    }]
  },
  { timestamps: true }
)

ClassSchema.index({ days: 1, startTime: 1 })

type ClassDocument = InferSchemaType<typeof ClassSchema>

interface IClassDocument extends ClassDocument, Document { }
interface IClassModel extends Model<IClassDocument> { }

const ClassModel = model<IClassModel>('Class', ClassSchema)

export { ClassSchema, ClassDocument, IClassModel, ClassModel }