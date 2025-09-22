import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Languages, MovieGenre, MovieRating, MovieStatus } from './enumerate.entity';
import { Person } from '../../person/entities/person.entity';
import { Review } from '../../reviews/entities/review.entity';

@Schema({ timestamps: true })
export class Movie extends Document {
  @Prop({ required: true, index: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: false })
  fullDescription?: string;

  @Prop({ required: true })
  releaseDate: Date;

  @Prop({ type: [String], enum: Object.values(MovieGenre) })
  genres: MovieGenre[];

  @Prop({ type: String, enum: Object.values(MovieStatus), default: MovieStatus.RELEASED })
  status: MovieStatus;

  @Prop()
  posterUrl: string;

  @Prop()
  backdropUrl: string;

  @Prop()
  trailerUrl: string;

  @Prop({ type: String, enum: MovieRating })
  contentRating: MovieRating;

  @Prop({ type: [{ type: Types.ObjectId, ref: Review.name }] })
  reviews?: Types.ObjectId[];

  
  @Prop({ default: 0 })
  ratingCount: number;

  @Prop()
  duration: number; // in minutes

  @Prop({ required: false })
  budget?: number;

  @Prop({ required: false })
  revenue?: number;

  @Prop({ type: Number, min: 0, max: 10 })
  voteAverage?: number;

  @Prop({ type: Number, default: 0 })
  voteCount: number;

  @Prop({ type: Number, default: 0 })
  popularity: number;

  @Prop([{
    person: { type: Types.ObjectId, ref: Person.name },
    character: String,
    order: Number
  }])
  cast: {
    person: Types.ObjectId,
    character: string,
    order: number
  }[];

  @Prop([{
    person: { type: Types.ObjectId, ref: Person.name },
    role: String,
    department: String
  }])
  crew: {
    person: Types.ObjectId,
    role: string,
    department: string
  }[];

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  streamingUrl: string;

  @Prop({ type: Boolean, default: false })
  isAdult: boolean;

  @Prop({ type: [String], enum: Object.values(Languages) })
  languages?: Languages[];

  @Prop()
  country?: string;

  @Prop()
  productionCompany?: string;

  @Prop({ type: [String] })
  directors: string[];

  @Prop({ type: [String] })
  writers: string[];

  @Prop({ type: Number, unique: true, sparse: true })
  tmdbId?: number;
}

export const MovieSchema = SchemaFactory.createForClass(Movie);

// Create compound text index for search
MovieSchema.index(
  { title: 'text', description: 'text', genres: 'text' },
  { weights: { title: 10, genres: 5, description: 1 } }
);