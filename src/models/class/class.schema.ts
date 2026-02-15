import { InferSchemaType, Model, Schema, model } from "mongoose"
import { Weekday } from "../../types/enums/Weekday"
import { IUserDocument, UserModel } from "../user/user.schema"
import { Role } from "../../types/enums/Role"
import { ClassType } from "../../types/enums/ClassType"
import { ClassStatus } from "../../types/enums/ClassStatus"
import { AmountSchema } from "../_common/amount.schema"
import { BillingFrequency } from "../../types/enums/BillingFrequency"

const ClassSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
      auto: true 
    },
    classType: {
      type: String, 
      enum: Object.values(ClassType),
      required: true
    },
    classLocation: {
      type: String,
      required: true
    },
    days: {
      type: [Number],
      validate: {
        validator: function(v: number[]) {
          return v.every(day => 
            Object.values(Weekday).includes(day) 
          )
        },
        message: 'Invalid day values'
      },
      required: true
    }, 
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: false
    },
    status: {
      type: String,
      enum: Object.values(ClassStatus),
      required: false,
      default: ClassStatus.ACTIVE
    },
    startTime: {
      type: String, // "14:30" = 2:30
      required: true
    },
    prices:  {
      type: [AmountSchema],
      required: true,
      _id: false
    },
    maxCapacity: {
      type: Number,
      required: true
    },
    billingFrequency: {
      type: String, 
      enum: Object.values(BillingFrequency), 
      required: true
    },
    checkIns: [{
      date: {
        type: Date, 
        required: true
      },
      employeeId: {
        type: String,
        ref: 'User',
        required: true,
        validate: {
          validator: async function (employeeId: String) {
            const user = await UserModel.findById(employeeId).lean() as IUserDocument | null
            return user && user.role === Role.INSTRUCTOR 
          },
          message: 'Assigned user must have the role of instructor.'
        }
      }, 
      clientIds: [{
        type: String,
        ref: 'User',
        required: true
      }]
    }],
    cancellations: [{
      date: {
        type: Date, 
        required: true
      },
      employeeId: {
        type: String,
        ref: 'User',
        required: true,
        validate: {
          validator: async function (employeeId: String) {
            // Allow 'system' as a placeholder until employeeId is properly implemented
            if (employeeId === 'system') {
              return true
            }
            const user = await UserModel.findById(employeeId).lean() as IUserDocument | null
            return user && user.role === Role.INSTRUCTOR 
          },
          message: 'Assigned user must have the role of instructor.'
        }
      },
      reason: {
        type: String,
        required: false
      },
      cancelledBy: {
        type: String,
        enum: ['instructor', 'client'],
        required: false
      }
    }],
    waitlist: [{
      type: String,
      required: false
    }],
    notes: {
      type: [{
        _id: {
          type: String,
          required: true
        },
        content: {
          type: String,
          required: true
        },
        createdAt: {
          type: Date,
          required: true,
          default: Date.now
        },
        updatedAt: {
          type: Date,
          required: true,
          default: Date.now
        }
      }],
      required: false,
      default: []
    }
  },
  { timestamps: true }
)

ClassSchema.index({ days: 1, startTime: 1 })

type ClassDocument = InferSchemaType<typeof ClassSchema>

interface IClassDocument extends ClassDocument, Document { }
interface IClassModel extends Model<IClassDocument> { }

const ClassModel = model<IClassModel>('Class', ClassSchema)

export { ClassSchema, ClassDocument, IClassModel, ClassModel }