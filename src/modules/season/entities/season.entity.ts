import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Season extends Document {
  @Prop({ required: true })
  seasonNumber: number;

  @Prop({ required: true })
  releaseDate: Date;

  @Prop()
  description?: string;

  @Prop()
  posterUrl?: string;

  @Prop({ type: Number, min: 0, max: 5, default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  ratingCount: number;

  @Prop({ type: Number, default: 0 })
  popularity: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Episode' }] })
  episodes: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'TvShow', required: true })
  tvShow: Types.ObjectId;
}

export const SeasonSchema = SchemaFactory.createForClass(Season);
