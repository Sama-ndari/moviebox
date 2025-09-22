import { IsNotEmpty, IsString, IsOptional, IsDate, IsBoolean, IsEnum, IsArray, IsObject, IsNumber, IsDateString, Min } from 'class-validator';
import { PersonRole, SocialMedia, Award } from "../entities/enumerate.entity";
import { Types } from "mongoose";
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreatePersonDto {
    @ApiProperty({ description: 'Name of the person', example: 'John Doe' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Biography of the person', example: 'A brief biography', required: false })
    @IsOptional()
    @IsString()
    biography?: string;

    @ApiProperty({ description: 'Birth date of the person', example: '1975-09-10', required: false })
    @IsOptional()
    @IsDateString()
    birthDate?: Date;

    @ApiProperty({ description: 'Birth date of the person', example: '1975-09-10', required: false })
    @IsOptional()
    @IsDateString()
    deathDate?: Date;

    @ApiProperty({ description: 'Birth place of the person', example: 'New York, USA', required: false })
    @IsOptional()
    @IsString()
    birthPlace?: string;

    @ApiProperty({ description: 'Nationality of the person', example: 'American', required: false })
    @IsOptional()
    @IsString()
    nationality?: string;

    @ApiProperty({ description: 'Profile picture path of the person', example: '/images/profile.jpg' })
    @IsString()
    @IsNotEmpty()
    profilePath: string;

    @ApiProperty({ description: 'Is the person active?', example: true, required: false })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiProperty({ description: 'Roles of the person', example: ['Actor', 'Director'], isArray: true })
    @IsArray()
    @IsEnum(PersonRole, { each: true })
    @IsNotEmpty()
    roles: PersonRole[];

    @ApiProperty({ description: 'Social media links of the person', example: { twitter: '@johndoe' }, required: false })
    @IsOptional()
    @IsObject()
    socialMedia?: SocialMedia;

    @ApiProperty({ description: 'Filmography of the person', example: ['60d21b4667d0d8992e610c85'], isArray: true, required: false })
    @IsOptional()
    @IsArray()
    filmography?: Types.ObjectId[];

    @ApiProperty({
        description: 'Awards received by the person',
        example: [
            { name: 'Oscar', year: 2020, category: 'Best Actor', movie: '60d21b4667d0d8992e610c85' }
        ],
        isArray: true,
        required: false
    })
    @IsOptional()
    @IsArray()
    @IsObject({ each: true })
    awards?: Award[];

    @ApiProperty({ description: 'Height of the person in cm', example: 180, required: false })
    @IsOptional()
    @IsNumber()
    height?: number;

    @ApiProperty({ description: 'Known for works of the person', example: ['Inception', 'The Dark Knight'], isArray: true, required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    knownFor?: string[];

    @ApiProperty({ description: 'TMDb ID of the person', example: 31, required: false })
    @IsOptional()
    @IsNumber()
    tmdbId?: number;

    @ApiProperty({ description: 'Popularity score of the person', example: 85.5, required: false })
    @IsOptional()
    @IsNumber()
    popularity?: number;

    @ApiProperty({ description: 'Related people IDs', example: ['60d21b4667d0d8992e610c85'], isArray: true, required: false })
    @IsOptional()
    @IsArray()
    relatedPeople?: Types.ObjectId[];
}

// query-person.dto.ts
export class QueryPersonDto {
    @ApiProperty({ description: 'Page number', type: Number, default: 1, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number;
  
    @ApiProperty({ description: 'Items per page', type: Number, default: 10, required: false })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number;
  
    @ApiProperty({ description: 'Filter by role', enum: PersonRole, required: false })
    @IsOptional()
    @IsEnum(PersonRole)
    role?: PersonRole;
  
    @ApiProperty({ description: 'Search term for name or biography', type: String, required: false })
    @IsOptional()
    @IsString()
    search?: string;
  
    @ApiProperty({ description: 'Field to sort by', type: String, default: 'name', required: false })
    @IsOptional()
    @IsString()
    sortBy?: string;
  
    @ApiProperty({ description: 'Sort order', enum: ['asc', 'desc'], default: 'asc', required: false })
    @IsOptional()
    @IsEnum(['asc', 'desc'])
    sortOrder?: 'asc' | 'desc';
  }
