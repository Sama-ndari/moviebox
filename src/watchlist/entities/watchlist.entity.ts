// watchlists/schemas/watchlist.schema.ts
import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
// import { ContentType } from '../../reviews/schemas/review.schema';

@Schema({ timestamps: true })
export class Watchlist extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  // @Prop([{
  //   contentId: { type: Types.ObjectId, required: true },
  //   contentType: { type: String, enum: ContentType, required: true },
  //   addedAt: { type: Date, default: Date.now }
  // }])
  // items: {
  //   contentId: Types.ObjectId;
  //   contentType: ContentType;
  //   addedAt: Date;
  // }[];
}

export const WatchlistSchema = SchemaFactory.createForClass(Watchlist);

// Create index on userId for quick lookup
WatchlistSchema.index({ userId: 1 });

