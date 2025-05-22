import { InferSchemaType, Model, Schema, model } from "mongoose";
import { BillingFrequency } from "../../types/enums/BillingFrequency";
import { AmountSchema } from "../_common/amount.schema";

const EnrollmentSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
      auto: true 
    }, 
    userId: {
      type: String, 
      ref: 'User',
      required: true
    }, 
    classId: {
      type: String, 
      ref: 'Class',
      required: true
    }, 
    startDate: {
      type: Date,
      required: true
    },
    daysOfWeekOverride: {
      type: [Number],
      required: false
    },
    billingFrequency: {
      type: String,
      enum: Object.values(BillingFrequency),
      required: true
    },
    discountsApplied: [{
      discountId: {
        type: String,
        ref: 'Discount',
        required: false
      },
      amountOverride: {
        type: AmountSchema, 
        required: false
      },
      amountSnapshot: {
        type: AmountSchema,
        required: true
      },
      description: {
        type: String, 
        required: false
      }
    }],
    bonusSessions: {
      type: Number,
      required: false
    },
    cancelDate: {
      type: Date,
      required: false
    },
    cancelReason: {
      type: String, 
      required: false 
    }, 
    isTrial: {
      type: Boolean, 
      required: false 
    },
    invoiceIds: [{
      type: String, 
      ref: 'Invoice',
      required: false
    }]
  },
  { timestamps: true }
)

EnrollmentSchema.index({ userId: 1, classId: 1 }, { unique: true })

type EnrollmentDocument = InferSchemaType<typeof EnrollmentSchema>

interface IEnrollmentDocument extends EnrollmentDocument, Document { }
interface IEnrollmentModel extends Model<IEnrollmentDocument> { }

const EnrollmentModel = model<IEnrollmentModel>('Enrollment', EnrollmentSchema)
export { EnrollmentSchema, EnrollmentDocument, IEnrollmentDocument, IEnrollmentModel, EnrollmentModel }