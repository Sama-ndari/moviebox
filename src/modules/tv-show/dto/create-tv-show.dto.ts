import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { Types } from "mongoose";
import { MovieRating } from "../../movie/entities/enumerate.entity";


export class CreateTvShowDto {
    @ApiProperty({ example: 'Stranger Things' })
    @IsString()
    title: string;

    @ApiProperty({ example: 'A group of friends witness supernatural forces...' })
    @IsString()
    description: string;

    @ApiProperty({ example: '2016-07-15' })
    @IsDateString()
    releaseDate: string;

    @ApiProperty({ example: '2022-07-01', required: false })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiProperty({ example: ['Science Fiction', 'Horror', 'Drama'] })
    @IsArray()
    @IsString({ each: true })
    genres: string[];

    @ApiProperty({ example: 'https://example.com/poster.jpg', required: false })
    @IsOptional()
    @IsString()
    posterUrl?: string;

    @ApiProperty({ example: 'https://example.com/backdrop.jpg', required: false })
    @IsOptional()
    @IsString()
    backdropUrl?: string;

    @ApiProperty({ example: 'https://example.com/trailer.mp4', required: false })
    @IsOptional()
    @IsString()
    trailerUrl?: string;

    @ApiProperty({ example: MovieRating.PG_13 })
    @IsEnum(MovieRating)
    contentRating: MovieRating;

    @ApiProperty({ example: [{ person: '60d21b4667d0d8992e610c89', character: 'Eleven', order: 1 }] })
    @IsArray()
    cast: { person: string; character: string; order: number }[];

    @ApiProperty({ example: [{ person: '60d21b4667d0d8992e610c90', role: 'Director', department: 'Directing' }] })
    @IsArray()
    crew: { person: string; role: string; department: string }[];

    @ApiProperty({ example: false })
    @IsBoolean()
    isFeatured: boolean;
}

export class UpdateTvShowDto {
    @ApiProperty({ example: 'Stranger Things', required: false })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({ example: 'Updated description...', required: false })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({ example: '2016-07-15', required: false })
    @IsOptional()
    @IsDateString()
    releaseDate?: string;

    @ApiProperty({ example: '2022-07-01', required: false })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiProperty({ example: ['Science Fiction', 'Horror'], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    genres?: string[];

    @ApiProperty({ example: 'https://example.com/new-poster.jpg', required: false })
    @IsOptional()
    @IsString()
    posterUrl?: string;

    @ApiProperty({ example: 'https://example.com/new-backdrop.jpg', required: false })
    @IsOptional()
    @IsString()
    backdropUrl?: string;

    @ApiProperty({ example: 'https://example.com/new-trailer.mp4', required: false })
    @IsOptional()
    @IsString()
    trailerUrl?: string;

    @ApiProperty({ example: MovieRating.PG_13, required: false })
    @IsOptional()
    @IsEnum(MovieRating)
    contentRating?: MovieRating;

    @ApiProperty({ example: 0, required: false })
    @IsOptional()
    @IsNumber()
    @Min(0)
    popularity?: number;

    @ApiProperty({ example: [{ person: '60d21b4667d0d8992e610c89', character: 'Eleven', order: 1 }], required: false })
    @IsOptional()
    @IsArray()
    cast?: { person: string; character: string; order: number }[];

    @ApiProperty({ example: [{ person: '60d21b4667d0d8992e610c90', role: 'Director', department: 'Directing' }], required: false })
    @IsOptional()
    @IsArray()
    crew?: { person: string; role: string; department: string }[];

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    isFeatured?: boolean;

    @ApiProperty({ example: true, required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ description: 'Array of season ids', example: ['60d21b4667d0d8992e610c91'], required: false })
    @IsOptional()
    @IsArray()
    seasons?: Types.ObjectId[];
}

export class QueryTvShowDto {
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

    @ApiProperty({ example: 'Action', required: false })
    @IsOptional()
    @IsString()
    genre?: string;

    @ApiProperty({ example: 'Stranger', required: false })
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
    sortOrder?: 'asc' | 'desc'='desc';

    @ApiProperty({ example: '2020-01-01', required: false })
    @IsOptional()
    @IsDateString()
    releaseDate?: string;

    @ApiProperty({ example: 'USA', required: false })
    @IsOptional()
    @IsString()
    country?: string;
}

export class RateTvShowDto {
    @ApiProperty({ example: 4.5 })
    @IsNumber()
    @Min(0)
    @Max(5)
    rating: number;
}
