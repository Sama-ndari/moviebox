import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreateMovieFromTMDbDto {
  @ApiProperty({ description: 'TMDb ID of the movie', example: 27205, required: false })
  @IsOptional()
  @IsNumber()
  tmdbId?: number;

  @ApiProperty({ description: 'Title of the movie', example: 'Inception', required: false })
  @IsOptional()
  @IsString()
  title?: string;
}
