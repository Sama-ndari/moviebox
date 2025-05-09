// // episodes/schemas/episode.schema.ts
// import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
// import { Document, Types } from 'mongoose';

// @Schema({ timestamps: true })
// export class Episode extends Document {
//   @Prop({ type: Types.ObjectId, ref: 'TvShow', required: true, index: true })
//   tvShowId: Types.ObjectId;

//   @Prop({ required: true })
//   title: string;

//   @Prop({ required: true })
//   description: string;

//   @Prop({ required: true })
//   seasonNumber: number;

//   @Prop({ required: true })
//   episodeNumber: number;

//   @Prop()
//   releaseDate: Date;

//   @Prop()
//   duration: number; // in minutes

//   @Prop()
//   thumbnailUrl: string;

//   @Prop()
//   streamingUrl: string;

//   @Prop({ default: true })
//   isActive: boolean;
// }

// export const EpisodeSchema = SchemaFactory.createForClass(Episode);

// // Create compound index for finding episodes
// EpisodeSchema.index({ tvShowId: 1, seasonNumber: 1, episodeNumber: 1 }, { unique: true });
