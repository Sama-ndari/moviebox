import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsArray, IsString } from 'class-validator';

export class UpdateSharingDto {
  @ApiProperty({
    description: 'Whether the watchlist item is public',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({
    description: 'A list of user IDs to share the watchlist item with',
    example: ['60d21b4667d0d8992e610c85'],
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sharedWith?: string[];
}
