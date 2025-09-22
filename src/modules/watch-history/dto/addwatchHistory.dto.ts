import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToWatchHistoryDto {
  @IsString()
  @ApiProperty({ description: 'ID of the content watched', example: '60d21b4667d0d8992e610c89' })
  contentId: string;

  @IsEnum(['Movie', 'TvShow', 'Season', 'Episode'])
  @ApiProperty({ description: 'Type of the content', example: 'Episode' })
  contentType: string;

  @IsNumber()
  @ApiProperty({ description: 'Duration watched in minutes', example: 45 })
  durationWatched: number;

  @IsBoolean()
  @ApiProperty({ description: 'Whether the content was fully watched', example: true })
  completed: boolean;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: 'User rating (0-5)', example: 4 })
  rating?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Context of watching', example: 'Mobile' })
  watchContext?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: 'Last pause point in minutes', example: 30 })
  lastPausePoint?: number;
}

export class UpdateWatchHistoryDto {
  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: 'Duration watched in minutes', example: 60 })
  durationWatched?: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ description: 'Whether the content was fully watched', example: true })
  completed?: boolean;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: 'User rating (0-5)', example: 5 })
  rating?: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: 'Last pause point in minutes', example: 45 })
  lastPausePoint?: number;
}