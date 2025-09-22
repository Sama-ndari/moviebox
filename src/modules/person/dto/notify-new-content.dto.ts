import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class NotifyNewContentDto {
  @ApiProperty({
    description: 'The title of the new content (e.g., a movie or TV show)',
    example: 'The Matrix Resurrections',
  })
  @IsNotEmpty()
  @IsString()
  newContentTitle: string;
}
