import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { MovieRating } from '../../movie/entities/enumerate.entity';
import { Person } from '../../person/entities/person.entity';

@Schema({ timestamps: true })
export class TvShow extends Document {
    @Prop({ required: true, index: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    releaseDate: Date;

    @Prop()
    endDate?: Date;

    @Prop({ type: [String], index: true })
    genres: string[];

    @Prop()
    posterUrl: string;

    @Prop()
    backdropUrl: string;

    @Prop()
    trailerUrl: string;

    @Prop({ type: String, enum: MovieRating })
    contentRating: MovieRating;

    @Prop({ type: Number, min: 0, max: 5, default: 0 })
    averageRating: number;

    @Prop({ default: 0 })
    ratingCount: number;

    @Prop({ type: Number, default: 0 })
    popularity: number;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Season' }] })
    seasons: Types.ObjectId[];

    @Prop({ default: 0 })
    totalEpisodes: number;

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

    @Prop({ type: Number, unique: true, sparse: true })
    tmdbId?: number;
}

export const TvShowSchema = SchemaFactory.createForClass(TvShow);

// Create compound text index for search
TvShowSchema.index(
    { title: 'text', description: 'text', genres: 'text' },
    { weights: { title: 10, genres: 5, description: 1 } }
);