import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsArray, IsNumber, IsEnum, IsBoolean } from 'class-validator';
import { MovieGenre, MovieStatus, MovieRating, Languages } from '../entities/enumerate.entity';

export class CreateMovieDto {
  @ApiProperty({ description: 'The title of the movie', example: 'The Dark Knight' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Short description of the movie', example: 'A vigilante battles crime in Gotham' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Detailed description of the movie', example: 'When the menace known as the Joker emerges...', required: false })
  @IsOptional()
  @IsString()
  fullDescription?: string;

  @ApiProperty({ description: 'Release date of the movie', example: '2008-07-18' })
  @IsDateString()
  releaseDate: string;

  @ApiProperty({ description: 'Genres of the movie', example: ['Action', 'Drama'], enum: MovieGenre })
  @IsArray()
  @IsEnum(MovieGenre, { each: true })
  genres: MovieGenre[];

  @ApiProperty({ description: 'Status of the movie', example: MovieStatus.RELEASED, enum: MovieStatus })
  @IsEnum(MovieStatus)
  status: MovieStatus;

  @ApiProperty({ description: 'URL of the movie poster', example: 'https://example.com/poster.jpg' })
  @IsString()
  posterUrl: string;

  @ApiProperty({ description: 'URL of the movie backdrop', example: 'https://example.com/backdrop.jpg' })
  @IsString()
  backdropUrl: string;

  @ApiProperty({ description: 'URL of the movie trailer', example: 'https://example.com/trailer.mp4' })
  @IsString()
  trailerUrl: string;

  @ApiProperty({ description: 'Content rating of the movie', example: MovieRating.PG_13, enum: MovieRating })
  @IsEnum(MovieRating)
  contentRating: MovieRating;

  @ApiProperty({ description: 'Duration of the movie in minutes', example: 152 })
  @IsNumber()
  duration: number;

  @ApiProperty({ description: 'Budget of the movie in USD', example: 185000000, required: false })
  @IsOptional()
  @IsNumber()
  budget?: number;

  @ApiProperty({ description: 'Revenue of the movie in USD', example: 1004558444, required: false })
  @IsOptional()
  @IsNumber()
  revenue?: number;

  @ApiProperty({ description: 'Average vote rating (0-10)', example: 9.0, required: false })
  @IsOptional()
  @IsNumber()
  voteAverage?: number;

  @ApiProperty({ description: 'Number of votes', example: 25000, required: false })
  @IsOptional()
  @IsNumber()
  voteCount?: number;

  @ApiProperty({ description: 'Popularity score', example: 150.5, required: false })
  @IsOptional()
  @IsNumber()
  popularity?: number;

  @ApiProperty({ description: 'Whether the movie is featured', example: true })
  @IsBoolean()
  isFeatured: boolean;

  @ApiProperty({ description: 'Whether the movie is active', example: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Streaming URL of the movie', example: 'https://example.com/stream' })
  @IsString()
  streamingUrl: string;

  @ApiProperty({ description: 'Whether the movie is adult-only', example: false })
  @IsBoolean()
  isAdult: boolean;

  @ApiProperty({ description: 'Languages in the movie', example: [Languages.ENGLISH], enum: Languages, required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(Languages, { each: true })
  languages?: Languages[];

  @ApiProperty({ description: 'Country of origin', example: 'USA', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Production company', example: 'Warner Bros.', required: false })
  @IsOptional()
  @IsString()
  productionCompany?: string;

  @ApiProperty({ description: 'Directors of the movie', example: ['Christopher Nolan'] })
  @IsArray()
  @IsString({ each: true })
  directors: string[];

  @ApiProperty({ description: 'Writers of the movie', example: ['Jonathan Nolan'] })
  @IsArray()
  @IsString({ each: true })
  writers: string[];

  @ApiProperty({
    description: 'Cast of the movie',
    example: [
      { person: '60d21b4667d0d8992e610c85', character: 'Bruce Wayne', order: 1 },
      { person: '60d21b4667d0d8992e610c86', character: 'Joker', order: 2 }
    ]
  })
  @IsArray()
  @IsOptional()
  cast?: {
    person: string;
    character: string;
    order: number;
  }[];

  @ApiProperty({
    description: 'Crew of the movie',
    example: [
      { person: '60d21b4667d0d8992e610c87', role: 'Director', department: 'Directing' },
      { person: '60d21b4667d0d8992e610c88', role: 'Producer', department: 'Production' }
    ]
  })
  @IsArray()
  @IsOptional()
  crew?: {
    person: string;
    role: string;
    department: string;
  }[];

  @ApiProperty({ description: 'TMDb ID of the movie', example: 27205, required: false })
  @IsOptional()
  @IsNumber()
  tmdbId?: number;

}