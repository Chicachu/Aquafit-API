import { InferSchemaType, model, Model, Schema } from "mongoose";
import { Currency } from "../../types/enums/Currency";
import { PaymentStatus } from "../../types/enums/PaymentStatus";

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
    amount: {
      type: new Schema(
        {
          currency: {
            type: String, 
            enum: Object.values(Currency), 
            required: true
          },
          value: {
            type: Number, 
            required: true
          }
        }
      ),
      required: true
    },
    discountsApplied: [{
      discountId: {
        type: String,
        required: true
      },
      amount: {
        type: Number, 
        required: true
      }
    }], 
    payments: [{
      type: new Schema(
        {
          currency: {
            type: String, 
            enum: Object.values(Currency), 
            required: true
          },
          value: {
            type: Number, 
            required: true
          },
          date: {
            type: Date, 
            required: true
          }
        }
      ),
      required: true
    }],
    paymentStatus: {
      type: String, 
      enum: Object.values(PaymentStatus)
    },
    dueDate: Date
  }, 
  { timestamps: true }
)


// have virtual fields for amountDue and remainingBalance 

type PaymentDocument = InferSchemaType<typeof PaymentSchema>

interface IPaymentDocument extends PaymentDocument, Document { }
interface IPaymentModel extends Model<IPaymentDocument> { }

const PaymentModel = model<IPaymentModel>('Payment', PaymentSchema)
export { PaymentSchema, PaymentDocument, IPaymentDocument, IPaymentModel, PaymentModel }