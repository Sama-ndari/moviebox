import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { PersonRole, SocialMedia, Award } from "./enumerate.entity";
import { Movie } from "../../movie/entities/movie.entity";

@Schema({
    timestamps: true, // Adds createdAt and updatedAt fields automatically
  })
  export class Person extends Document {
    @Prop({ required: true, index: true })
    name: string;
  
    @Prop()
    biography: string;
  
    @Prop()
    birthDate: string;
  
    @Prop()
    deathDate?: string;
  
    @Prop()
    birthPlace?: string;
  
    @Prop()
    nationality?: string;
  
    @Prop()
    profilePath: string;
  
    @Prop({ default: true })
    isActive: boolean;
  
    @Prop({ type: Number, unique: true, sparse: true })
    tmdbId?: number;


    @Prop({ type: [String], enum: Object.values(PersonRole), default: [PersonRole.ACTOR] })
    roles: PersonRole[];
  
    @Prop({ type: Object })
    socialMedia?: SocialMedia;
  
    @Prop([{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }])
    filmography: mongoose.Schema.Types.ObjectId[];
  
    @Prop([{ type: Object }])
    awards?: Award[];
  
    @Prop()
    height?: number; // in cm
  
    @Prop({ type: [String] })
    knownFor?: string[]; // Notable works or characteristics
  
    @Prop({ type: Number, default: 0 })
    popularity: number; // Popularity metric for sorting/filtering
  
    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: Person.name }] })
    relatedPeople?: mongoose.Schema.Types.ObjectId[]; // Collaborators, family members in industry
  }
  
  export type PersonDocument = Person & Document;
export const PersonSchema = SchemaFactory.createForClass(Person);
  
  // Add text index for search functionality
  PersonSchema.index({ name: 'text', biography: 'text' });