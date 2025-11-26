import { Schema, model, Document } from 'mongoose';

export interface ICourt extends Document {
  name: string;
  color?: string;
  openingHours?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const CourtSchema = new Schema<ICourt>({
  name: { type: String, required: true },
  color: { type: String },
  openingHours: [{ type: String }],
}, { timestamps: true });

export const Court = model<ICourt>('Court', CourtSchema);
