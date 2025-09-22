import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/entities/user.entity';

export enum NotificationType {
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  NEW_CONTENT = 'NEW_CONTENT',
  GENERAL = 'GENERAL',
}

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId; // The recipient

  @Prop({ type: String, enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  sender?: Types.ObjectId; // The user who triggered the notification

  @Prop({ type: String, required: true })
  message: string;

  @Prop({ type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' })
  priority: string;

  @Prop({ type: String, enum: ['InApp', 'Email', 'Both'], default: 'InApp' })
  deliveryMethod: string;

  @Prop({ type: Boolean, default: false })
  isRead: boolean;

  @Prop({ type: Date }) // Optional expiration for time-sensitive notifications
  expiresAt?: Date;

  @Prop({ type: String }) // Optional link to related content (e.g., watchlist item)
  relatedLink?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Index for efficient querying
NotificationSchema.index({ user: 1, createdAt: -1 });