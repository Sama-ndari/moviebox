import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';


@Schema({ timestamps: true })
export class WatchlistItem extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, refPath: 'contentType', required: true })
  content: Types.ObjectId;

  @Prop({ type: String, enum: ['Movie', 'TvShow', 'Season', 'Episode'], required: true })
  contentType: string;

  @Prop({ type: Date, default: Date.now })
  addedAt: Date;

  @Prop({ type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' })
  priority: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Number, default: 0, min: 0 }) // Progress in minutes
  watchProgress: number;

  @Prop({ type: String }) // Unique ID for sharing (e.g., UUID)
  shareLink?: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: false })
  isPublic: boolean;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  sharedWith: Types.ObjectId[];

  @Prop({ type: Date }) // Scheduled watch party date
  watchPartyDate?: Date;

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] }) // Invited users for watch party
  watchPartyParticipants: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  watchPartyEnabled: boolean;
}

export const WatchlistItemSchema = SchemaFactory.createForClass(WatchlistItem);

// Index for efficient querying
WatchlistItemSchema.index({ user: 1, content: 1, contentType: 1 }, { unique: true });