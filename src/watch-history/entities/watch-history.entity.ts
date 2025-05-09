// // watch-history/schemas/watch-history.schema.ts
// import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
// import { Document, Types } from 'mongoose';
// // import { ContentType } from '../../reviews/schemas/review.schema';

// @Schema({ timestamps: true })
// export class WatchHistory extends Document {
//   @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
//   userId: Types.ObjectId;

//   @Prop({ type: Types.ObjectId, required: true })
//   contentId: Types.ObjectId;

//   // @Prop({ type: String, enum: ContentType, required: true })
//   // contentType: ContentType;

//   @Prop({ type: Types.ObjectId })
//   episodeId: Types.ObjectId; // Only for TV shows

//   @Prop({ default: 0 })
//   watchedDuration: number; // in seconds

//   @Prop({ default: 0 })
//   totalDuration: number; // in seconds

//   @Prop()
//   watchedAt: Date;

//   @Prop({ default: false })
//   completed: boolean;
// }

// export const WatchHistorySchema = SchemaFactory.createForClass(WatchHistory);

// // Create compound index for user's history
// WatchHistorySchema.index({ userId: 1, contentId: 1, episodeId: 1 });
