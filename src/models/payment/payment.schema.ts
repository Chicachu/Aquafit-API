import { InferSchemaType, model, Model, Schema } from "mongoose";
import { Currency } from "../../types/enums/Currency";
import { PaymentStatus } from "../../types/enums/PaymentStatus";

const PaymentSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true,
      auto: true 
    },
    userId: {
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: true
    }, 
    enrollmentId: {
      type: Schema.Types.ObjectId, 
      ref: 'Enrollment',
      required: true
    },
    amountDue: {
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
    discount: Number, 
    paymentStatus: {
      type: String, 
      enum: Object.values(PaymentStatus)
    },
    dueDate: Date
  }, 
  { timestamps: true }
)

type PaymentDocument = InferSchemaType<typeof PaymentSchema>

interface IPaymentDocument extends PaymentDocument, Document { }
interface IPaymentModel extends Model<IPaymentDocument> { }

const PaymentModel = model<IPaymentModel>('Payment', PaymentSchema)
export { PaymentSchema, PaymentDocument, IPaymentDocument, IPaymentModel, PaymentModel }