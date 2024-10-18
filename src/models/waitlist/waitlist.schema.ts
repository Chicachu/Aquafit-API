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
  },
  { timestamps: true }
)

type WaitlistDocument = InferSchemaType<typeof WaitlistSchema> 

interface IWaitlistDocument extends WaitlistDocument, Document { }
interface IWaitlistModel extends Model<IWaitlistDocument> { }

const WaitlistModel = model<IWaitlistModel>('Waitlist', WaitlistSchema)

export { WaitlistSchema, WaitlistDocument, IWaitlistDocument, IWaitlistModel, WaitlistModel }