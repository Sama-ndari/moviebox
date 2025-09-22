import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class WatchHistory extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, refPath: 'contentType', required: true })
  content: Types.ObjectId;

  @Prop({ type: String, enum: ['Movie', 'TvShow', 'Season', 'Episode'], required: true })
  contentType: string;

  @Prop({ type: Date, default: Date.now })
  watchedAt: Date;

  @Prop({ type: Number, default: 0 })
  durationWatched: number; // in minutes

  @Prop({ type: Boolean, default: false })
  completed: boolean;

  @Prop({ type: Number, min: 0, max: 5 }) // User rating (0-5 stars)
  rating?: number;

  @Prop({ type: String, enum: ['Home', 'Mobile', 'Theater', 'Laptop','Tablet','Other'], default: 'Home' })
  watchContext: string; // Where the user watched it

  @Prop({ type: Number, default: 0 })
  lastPausePoint: number; // Timestamp in minutes where user paused
}

export const WatchHistorySchema = SchemaFactory.createForClass(WatchHistory);