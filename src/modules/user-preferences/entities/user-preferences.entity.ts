// src/user/entities/user-preferences.entity.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class UserPreferences extends Document {
  @Prop({ type: String, ref: 'User', required: true })
  user: string;

  @Prop({ type: [String], default: ['Movies', 'TVShows'] }) // Preferred content types
  contentTypes: string[];

  @Prop({ type: [String], default: ['Action', 'Drama'] }) // Preferred genres
  genres: string[];

  @Prop({ type: String, enum: ['Daily', 'Weekly', 'Instant'], default: 'Instant' }) // Notification frequency
  notificationFrequency: string;

  @Prop({ type: [String], default: ['InApp', 'Email'] }) // Preferred delivery methods
  deliveryMethods: string[];

  @Prop({ type: Boolean, default: false }) // Do Not Disturb mode
  doNotDisturb: boolean;

  @Prop({ type: { start: String, end: String }, default: { start: '22:00', end: '08:00' } }) // Quiet hours
  quietHours: { start: string; end: string };
}

export const UserPreferencesSchema = SchemaFactory.createForClass(UserPreferences);