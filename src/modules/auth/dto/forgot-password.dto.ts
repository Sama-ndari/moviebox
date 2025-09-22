import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'The email of the user to reset the password for',
    example: 'samandari@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
