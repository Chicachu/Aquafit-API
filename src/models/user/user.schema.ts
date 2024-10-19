import { InferSchemaType, model, Model, Schema } from "mongoose";
import { Role } from "../../types/enums/Role";

const UserSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
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
    username: {
      type: String,
      required: false
    },
    password: {
      type: String,
      required: false
    },
    role: {
      type: String,
      enum: Object.values(Role),
      required: true
    }, 
    accessToken: String
  }
)

UserSchema.index({ username: 1 })

type UserDocument = InferSchemaType<typeof UserSchema> & {
  role: Role
}

interface IUserDocument extends UserDocument, Document { }
interface IUserModel extends Model<IUserDocument> { } 

const UserModel = model<IUserModel>('User', UserSchema)

export { UserSchema, UserDocument, IUserDocument, IUserModel, UserModel }