import { Schema, model, Document, Types } from 'mongoose';

export interface IBooking extends Document {
  user: Types.ObjectId;
  court: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const BookingSchema = new Schema<IBooking>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  court: { type: Schema.Types.ObjectId, ref: 'Court', required: true, index: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { type: String, default: 'CONFIRMED' },
}, { timestamps: true });

export const Booking = model<IBooking>('Booking', BookingSchema);
