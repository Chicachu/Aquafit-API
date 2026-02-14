import { InferSchemaType, Model, Schema, model } from "mongoose";

const WaitlistSchema = new Schema(
  {
    _id: String,
    classId: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    }
    // No phoneNumber – waitlist is (classId, userId) only; phone lives on User
  },
  { timestamps: true, strict: true }
)

// Unique on the combination (classId, userId): same user can be on many classes, same class many users
WaitlistSchema.index(
  { classId: 1, userId: 1 },
  { unique: true, name: 'waitlist_classId_userId_unique' }
)

type WaitlistDocument = InferSchemaType<typeof WaitlistSchema>

interface IWaitlistDocument extends WaitlistDocument, Document {}
interface IWaitlistModel extends Model<IWaitlistDocument> {}

const WaitlistModel = model<IWaitlistModel>('Waitlist', WaitlistSchema)

export { WaitlistSchema, WaitlistDocument, IWaitlistDocument, IWaitlistModel, WaitlistModel }