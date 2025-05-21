import { InferSchemaType, model, Model, Schema } from "mongoose";
import { Currency } from "../../types/enums/Currency";
import { PaymentStatus } from "../../types/enums/PaymentStatus";
import { PaymentType } from "../../types/enums/PaymentType";
import { AmountSchema } from "../_common/amount.schema";

const PaymentSchema = new Schema(
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
      start: {
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

PaymentSchema.virtual('amountDue').get(function (this: IPaymentDocument) {
  const totalCharge = this.charge?.amount || 0;
  const totalDiscounts = calculateTotalDiscounts(this.discountsApplied);
  return totalCharge - totalDiscounts;
});

PaymentSchema.virtual('remainingBalance').get(function (this: IPaymentDocument) {
  const totalCharge = this.charge?.amount || 0;
  const totalDiscounts = calculateTotalDiscounts(this.discountsApplied);
  const totalPayments = (this.paymentsApplied || []).reduce((sum, p) => sum + p.amount, 0);
  return totalCharge - totalDiscounts - totalPayments;
});


type PaymentDocument = InferSchemaType<typeof PaymentSchema>

interface IPaymentDocument extends PaymentDocument, Document {
  populated(path: string): any
}
interface IPaymentModel extends Model<IPaymentDocument> { }

const PaymentModel = model<IPaymentModel>('Payment', PaymentSchema)
export { PaymentSchema, PaymentDocument, IPaymentDocument, IPaymentModel, PaymentModel }