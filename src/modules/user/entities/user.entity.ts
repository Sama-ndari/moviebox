import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { ApiProperty } from '@nestjs/swagger';
import { IUser } from '../interfaces/user.interface';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export type UserDocument = IUser & Document;

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  @ApiProperty({ description: 'Unique username of the user', example: 'samandari' })
  username: string;

  @Prop({ required: true, unique: true })
  @ApiProperty({ description: 'Unique email address of the user', example: 'samandari@example.com' })
  email: string;

  @Prop({ required: true })
  @ApiProperty({ description: 'Hashed password of the user', example: 'hashed_password' })
  password: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  @ApiProperty({ description: 'Role of the user', example: 'user', enum: UserRole })
  role: UserRole;

  @Prop()
  @ApiProperty({ description: 'URL of the user\'s profile image', example: 'https://example.com/profile.jpg' })
  profileImageUrl?: string;

  @Prop()
  @ApiProperty({ description: 'Short biography of the user', example: 'Software developer and movie enthusiast.' })
  bio?: string;

  @Prop({ default: true })
  @ApiProperty({ description: 'Indicates if the user account is active', example: true })
  isActive: boolean;

  @Prop()
  @ApiProperty({ description: 'Timestamp of the user\'s last login', example: '2023-01-01T12:00:00Z' })
  lastLogin?: Date;

  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  followers: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  following: Types.ObjectId[];


}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre<UserDocument>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};
