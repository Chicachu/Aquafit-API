import { InferSchemaType, model, Model, Schema } from "mongoose";
import { Role } from "../../types/enums/Role";
import { Currency } from "../../types/enums/Currency";

const UserSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
      auto: true 
    },
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    phoneNumber: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true
    }, 
    username: {
      type: String,
      required: false
    },
    password: {
      type: String,
      required: false
    },
    credits: {
      type: {
        amount: {
          type: Number, 
          required: true
        },
        currency: {
          type: String,
          enum: Object.values(Currency),
          required: true
        }
      },
      required: false
    },
    accessToken: {
      type: String,
      required: false
    }
  },
  { timestamps: true }
)

UserSchema.index({ username: 1 })

type UserDocument = InferSchemaType<typeof UserSchema>

interface IUserDocument extends UserDocument, Document { }
interface IUserModel extends Model<IUserDocument> { } 

const UserModel = model<IUserModel>('User', UserSchema)

export { UserSchema, UserDocument, IUserDocument, IUserModel, UserModel }