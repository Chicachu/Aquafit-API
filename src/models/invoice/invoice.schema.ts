import { InferSchemaType, model, Model, Schema } from "mongoose";
import { PaymentStatus } from "../../types/enums/PaymentStatus";
import { PaymentType } from "../../types/enums/PaymentType";
import { AmountSchema } from "../_common/amount.schema";
const PeriodSchema = new Schema(
  {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date, 
      required: true
    }
  }
)

const InvoiceSchema = new Schema(
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
    enrollmentId: {
      type: String, 
      ref: 'Enrollment',
      required: true
    },
    originalPrice: {
      type: AmountSchema,
      required: true
    },
    charge: {
      type: AmountSchema,
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
        required: false
      },
      description: {
        type: String, 
        required: false
      }
    }], 
    paymentsApplied: [{
      charge: {
        type: AmountSchema,
        required: true
      },
      date: {
        type: Date, 
        required: true
      },
      paymentType: {
        type: String, 
        enum: Object.values(PaymentType),
        required: true
      }
    }],
    paymentStatus: {
      type: String, 
      enum: Object.values(PaymentStatus),
      required: true
    },
    period: {
      type: PeriodSchema, 
      required: true
    },
    bonusSessionsApplied: {
      type: Number,
      required: false,
      default: 0,
      min: 0
    },
    lateFee: {
      type: AmountSchema,
      required: false
    },
    notes: {
      type: String,
      required: false
    },
    paymentRemindersSent: [{
      type: Date,
      required: false
    }]
  }, 
  { timestamps: true }
)

function calculateTotalDiscounts(discounts: any[]): number {
  return (discounts || []).reduce((sum, d) => {
    // amountSnapshot represents the discount amount (how much was discounted)
    if (d.amountSnapshot?.amount != null) {
      return sum + d.amountSnapshot.amount;
    }
    // amountOverride is an alternative way to store discount amount
    if (d.amountOverride?.amount != null) {
      return sum + d.amountOverride.amount;
    }
    return sum;
  }, 0);
}

InvoiceSchema.virtual('amountDue').get(function (this: IInvoiceDocument) {
  // amountDue is the final price after all discounts (same as charge)
  return this.charge?.amount || 0;
});

InvoiceSchema.virtual('remainingBalance').get(function (this: IInvoiceDocument) {
  // remainingBalance = amountDue - payments
  const amountDue = this.charge?.amount || 0;
  const totalPayments = (this.paymentsApplied || []).reduce((sum, p) => sum + p.charge.amount, 0);
  return amountDue - totalPayments;
});

InvoiceSchema.set('toObject', { virtuals: true });
InvoiceSchema.set('toJSON', { virtuals: true });

type BaseInvoiceDocument = InferSchemaType<typeof InvoiceSchema>
type InvoiceDocument = BaseInvoiceDocument & {
  remainingBalance: number
  amountDue: number
}

interface IInvoiceDocument extends InvoiceDocument, Document {
  populated(path: string): any
}
interface IInvoiceModel extends Model<IInvoiceDocument> { }

const InvoiceModel = model<IInvoiceModel>('Invoice', InvoiceSchema)
export { InvoiceSchema, InvoiceDocument, IInvoiceDocument, IInvoiceModel, InvoiceModel }