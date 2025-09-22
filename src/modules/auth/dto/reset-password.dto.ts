import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'The password reset token',
    example: 'some-secure-token',
  })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({
    description: 'The new password for the user',
    example: 'newSecurePassword123',
    minLength: 8,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;
}
