import { Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  role: string;
  profileImageUrl?: string;
  bio?: string;
  isActive: boolean;
  lastLogin?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  comparePassword(password: string): Promise<boolean>;
}
