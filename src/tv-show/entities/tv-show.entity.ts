// // tv-shows/schemas/tv-show.schema.ts
// import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
// import { Document } from 'mongoose';
// // import { ContentRating } from '../../movies/schemas/movie.schema';

// @Schema({ timestamps: true })
// export class TvShow extends Document {
//   @Prop({ required: true, index: true })
//   title: string;

//   @Prop({ required: true })
//   description: string;

//   @Prop({ required: true })
//   releaseDate: Date;

//   @Prop()
//   endDate: Date;

//   @Prop({ type: [String], index: true })
//   genres: string[];

//   @Prop()
//   posterUrl: string;

//   @Prop()
//   backdropUrl: string;

//   @Prop()
//   trailerUrl: string;

//   // @Prop({ type: String, enum: ContentRating })
//   // contentRating: ContentRating;

//   @Prop({ type: Number, min: 0, max: 5, default: 0 })
//   averageRating: number;

//   @Prop({ default: 0 })
//   ratingCount: number;

//   @Prop({ default: 1 })
//   seasons: number;

//   @Prop({ type: [{ name: String, character: String }] })
//   cast: { name: string; character: string }[];

//   @Prop({ type: [{ name: String, role: String }] })
//   crew: { name: string; role: string }[];

//   @Prop({ default: false })
//   isFeatured: boolean;

//   @Prop({ default: true })
//   isActive: boolean;
// }

// export const TvShowSchema = SchemaFactory.createForClass(TvShow);

// // Create compound text index for search
// TvShowSchema.index(
//   { title: 'text', description: 'text', genres: 'text' },
//   { weights: { title: 10, genres: 5, description: 1 } }
// );
