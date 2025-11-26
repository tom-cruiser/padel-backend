import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  user: Types.ObjectId;
  message: string;
  read: boolean;
  metadata?: any;
  createdAt?: Date;
}

const NotificationSchema = new Schema<INotification>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

export const Notification = model<INotification>('Notification', NotificationSchema);
