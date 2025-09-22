// src/reviews/dto/update-review.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';

export class UpdateReviewDto {
  @ApiProperty({ description: 'Rating given', example: 4.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiProperty({ description: 'Comment left by the client', example: 'Updated comment' })
  @IsOptional()
  @IsString()
  comment?: string;
}