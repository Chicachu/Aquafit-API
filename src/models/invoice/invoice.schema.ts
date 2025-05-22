import { InferSchemaType, model, Model, Schema } from "mongoose";
import { Currency } from "../../types/enums/Currency";
import { PaymentStatus } from "../../types/enums/PaymentStatus";
import { PaymentType } from "../../types/enums/PaymentType";
import { AmountSchema } from "../_common/amount.schema";

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
    charge: {
      currency: {
        type: String, 
        enum: Object.values(Currency), 
        required: true
      },
      amount: {
        type: Number, 
        required: true
      }
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
      currency: {
        type: String, 
        enum: Object.values(Currency), 
        required: true
      },
      amount: {
        type: Number, 
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
      required: false
    },
    period: {
      startDate: {
        type: Date,
        required: true
      },
      dueDate: {
        type: Date, 
        required: true
      }
    }
  }, 
  { timestamps: true }
)

function calculateTotalDiscounts(discounts: any[]): number {
  return (discounts || []).reduce((sum, d) => {
    if (d.amountOverride?.amount != null) {
      return sum + d.amountOverride.amount;
    }
    if (d.amountSnapshot?.amount != null) {
      return sum + d.amountSnapshot.amount;
    }
    return sum;
  }, 0);
}

InvoiceSchema.virtual('amountDue').get(function (this: IInvoiceDocument) {
  const totalCharge = this.charge?.amount || 0;
  const totalDiscounts = calculateTotalDiscounts(this.discountsApplied);
  return totalCharge - totalDiscounts;
});

InvoiceSchema.virtual('remainingBalance').get(function (this: IInvoiceDocument) {
  const totalCharge = this.charge?.amount || 0;
  const totalDiscounts = calculateTotalDiscounts(this.discountsApplied);
  const totalPayments = (this.paymentsApplied || []).reduce((sum, p) => sum + p.amount, 0);
  return totalCharge - totalDiscounts - totalPayments;
});


type InvoiceDocument = InferSchemaType<typeof InvoiceSchema>

interface IInvoiceDocument extends InvoiceDocument, Document {
  populated(path: string): any
}
interface IInvoiceModel extends Model<IInvoiceDocument> { }

const InvoiceModel = model<IInvoiceModel>('Invoice', InvoiceSchema)
export { InvoiceSchema, InvoiceDocument, IInvoiceDocument, IInvoiceModel, InvoiceModel }