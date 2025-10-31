import { Schema, model } from 'mongoose';

export interface IGalleryImage {
  title: string;
  description?: string;
  imageUrl: string;
  fileId: string;
  isActive: boolean;
  user: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const gallerySchema = new Schema<IGalleryImage>(
  {
    title: { type: String, required: true },
    description: { type: String },
    imageUrl: { type: String, required: true },
    fileId: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Gallery = model<IGalleryImage>('Gallery', gallerySchema);