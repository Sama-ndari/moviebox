import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';

export class CreatePersonFromTMDbDto {
  @ApiProperty({ description: 'TMDb ID of the person', example: 31, required: false })
  @IsOptional()
  @IsNumber()
  tmdbId?: number;

  @ApiProperty({ description: 'Name of the person', example: 'Tom Hanks', required: false })
  @IsOptional()
  @IsString()
  name?: string;
}
