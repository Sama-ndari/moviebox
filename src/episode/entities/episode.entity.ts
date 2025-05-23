import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Episode extends Document {
  @Prop({ required: true })
  episodeNumber: number;

  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true })
  duration: number; // in minutes

  @Prop({ required: true })
  releaseDate: Date;

  @Prop({ type: Number, min: 0, max: 5, default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  ratingCount: number;

  @Prop({ type: Number, default: 0 })
  popularity: number;

  @Prop()
  thumbnailUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'Season', required: true })
  season: Types.ObjectId;
}

export const EpisodeSchema = SchemaFactory.createForClass(Episode);