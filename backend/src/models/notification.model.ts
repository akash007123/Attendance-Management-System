import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema<INotification> = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, required: true, default: "SYSTEM" },
    isRead: { type: Boolean, default: false, index: true },
    link: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Notification = mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
