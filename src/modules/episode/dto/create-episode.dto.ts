import { IsString, IsNumber, IsDateString, IsOptional, IsBoolean, Min, Max, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateEpisodeDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  episodeNumber: number;

  @ApiProperty({ example: 'Chapter One: The Beginning' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'The story begins with an unexpected event...', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 45 })
  @IsNumber()
  @Min(1)
  duration: number;

  @ApiProperty({ example: '2023-06-01' })
  @IsDateString()
  releaseDate: string;

  @ApiProperty({ example: 'https://example.com/episode-thumbnail.jpg', required: false })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ example: '60d21b4667d0d8992e610c89' })
  @IsString()
  season: string;
}

export class UpdateEpisodeDto {
  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  episodeNumber?: number;

  @ApiProperty({ example: 'Chapter One: Updated Title', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Updated episode description...', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiProperty({ example: '2023-06-01', required: false })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiProperty({ example: 'https://example.com/new-episode-thumbnail.jpg', required: false })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}

export class QueryEpisodeDto {
  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @Type(() => Number) // This transforms string to number
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ example: 10, required: false })
  @IsOptional()
  @Type(() => Number) // This transforms string to number
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiProperty({ example: '60d21b4667d0d8992e610c89', required: false })
  @IsOptional()
  @IsString()
  season?: string;

  @ApiProperty({ example: '2023-01-01', required: false })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiProperty({ example: 'chapter', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: 'popularity', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ example: 'desc', required: false, enum: ['asc', 'desc'] })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class RateEpisodeDto {
  @ApiProperty({ example: 4.5 })
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;
}

export class WatchProgressDto {
  @ApiProperty({ example: 30 })
  @IsNumber()
  @Min(0)
  progress: number; // in minutes

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}