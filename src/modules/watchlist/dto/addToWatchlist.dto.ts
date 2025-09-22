import { IsString, IsOptional, IsEnum, IsArray, IsNumber, IsDateString, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToWatchlistDto {
  @IsMongoId()
  @ApiProperty({ description: 'ID of the content to add', example: '60d21b4667d0d8992e610c89' })
  contentId: string;

  @IsEnum(['Movie', 'TvShow', 'Season', 'Episode'])
  @ApiProperty({ description: 'Type of the content', example: 'Movie' })
  contentType: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Optional note or description', example: 'Watch with friends' })
  note?: string;

  @IsOptional()
  @IsEnum(['High', 'Medium', 'Low'])
  @ApiProperty({ description: 'Priority level', example: 'High', default: 'Medium' })
  priority?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ description: 'Tags for organization', example: ['Action', 'Favorites'] })
  tags?: string[];
}

export class UpdateWatchlistDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Optional note or description', example: 'Watch with family' })
  note?: string;

  @IsOptional()
  @IsEnum(['High', 'Medium', 'Low'])
  @ApiProperty({ description: 'Priority level', example: 'High' })
  priority?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiProperty({ description: 'Tags for organization', example: ['Action', 'Favorites'] })
  tags?: string[];

  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: 'Watch progress in minutes', example: 30 })
  watchProgress?: number;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ description: 'Scheduled watch party date', example: '2025-05-15T20:00:00Z' })
  watchPartyDate?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @ApiProperty({ description: 'IDs of users invited to watch party', example: ['60d21b4667d0d8992e610c90'] })
  watchPartyParticipants?: string[];
}

export class RemoveFromWatchlistDto {
  @IsString()
  @ApiProperty({ description: 'ID of the content to remove', example: '60d21b4667d0d8992e610c89' })
  contentId: string;

  @IsEnum(['Movie', 'TvShow', 'Season', 'Episode'])
  @ApiProperty({ description: 'Type of the content', example: 'Movie' })
  contentType: string;
}

export class ShareWatchlistDto {
  @IsString()
  @ApiProperty({ description: 'ID of the watchlist item to share', example: '60d21b4667d0d8992e610c89' })
  watchlistItemId: string;
}