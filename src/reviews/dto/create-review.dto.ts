// src/reviews/dto/create-review.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max, IsEnum } from 'class-validator';
import { ReviewTarget } from '../entities/review.entity';

export class CreateReviewDto {
  @ApiProperty({ description: 'ID of the target', example: '60d21b4667d0d8992e610c87' })
  @IsNotEmpty()
  targetId: string;

  @ApiProperty({ description: 'Type of the target', enum: ReviewTarget, example: 'User' })
  @IsNotEmpty()
  @IsEnum(ReviewTarget)
  targetType: ReviewTarget;

  @ApiProperty({ description: 'ID of the user', example: '60d21b4667d0d8992e610c85' })
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Rating given', example: 4.5 })
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @ApiProperty({ description: 'Comment left by the user', example: 'Very beautiful movie, I recommend!' })
  @IsOptional()
  @IsString()
  comment?: string;
}