import { ApiProperty, PartialType } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsInt, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

export class CreateSeasonDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  seasonNumber: number;

  @ApiProperty({ example: '2016-07-15' })
  @IsDateString()
  releaseDate: string;

  @ApiProperty({ example: 'The first season introduces the Upside Down...', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'https://example.com/season-poster.jpg', required: false })
  @IsOptional()
  @IsString()
  posterUrl?: string;

  @ApiProperty({ example: '60d21b4667d0d8992e610c85' })
  @IsString()
  tvShow: string;
}

export class UpdateSeasonDto extends PartialType(CreateSeasonDto) {
}

export class QuerySeasonDto {
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
  tvShow?: string;

  @ApiProperty({ example: '2023-01-01', required: false })
  @IsOptional()
  @IsDateString()
  releaseDate?: string;

  @ApiProperty({ example: 'season', required: false })
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

export class RateSeasonDto {
  @ApiProperty({ example: 4.5 })
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;
}