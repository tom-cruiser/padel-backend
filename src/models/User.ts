import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  avatar?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  role: { type: String, default: 'PLAYER' },
  avatar: { type: String },
}, { timestamps: true });

export const User = model<IUser>('User', UserSchema);
