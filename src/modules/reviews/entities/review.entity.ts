// src/reviews/entities/review.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
// import { User } from 'src/users/entities/user.entity'; // Ensure this path is correct
import { ApiProperty } from '@nestjs/swagger';

// Define the enum for target types
export enum ReviewTarget {
  Movie = 'Movie',
  Episode = 'Episode',
  TvShow = 'TvShow',
}

@Schema({ timestamps: true })
export class Review extends Document {
  @ApiProperty({ description: 'ID of the target', example: '60d21b4667d0d8992e610c87' })
  @Prop({ type: mongoose.Schema.Types.ObjectId, refPath: 'targetType', required: true, index: true })
  targetId: mongoose.Types.ObjectId;

  @ApiProperty({ description: 'Type of the target', enum: ReviewTarget })
  @Prop({ type: String, enum: ReviewTarget, required: true })
  targetType: ReviewTarget;

  // @ApiProperty({ description: 'ID of the user', example: '60d21b4667d0d8992e610c85' })
  // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name, required: true, index: true })
  // userId: mongoose.Types.ObjectId;

  @ApiProperty({ description: 'Rating given', example: 4.5 })
  @Prop({ required: true, min: 0, max: 5 })
  rating: number;

  @ApiProperty({ description: 'Comment left by the user', example: 'Very beautiful movie, I recommend!' })
  @Prop({ required: false })
  comment: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);