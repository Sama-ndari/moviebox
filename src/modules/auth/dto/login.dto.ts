// auth/dto/login.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, ValidateIf, IsNotEmpty, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
    @ApiProperty({ required: false, example: 'johndoe', description: 'Username' })
    @IsOptional()
    @IsString()
    @ValidateIf(o => !o.email)
    username?: string;

    @ApiProperty({ required: false, example: 'john.doe@example.com', description: 'Email address' })
    @IsOptional()
    @IsEmail()
    @ValidateIf(o => !o.username)
    email?: string;

    @ApiProperty({ example: 'Password123!', description: 'Password' })
    @IsString()
    password: string;
}

export class RefreshTokenDto {
    @ApiProperty({ description: 'Refresh token' })
    @IsString()
    @IsNotEmpty()
    refreshToken: string;
}

export class ForgotPasswordDto {
    @ApiProperty({ example: 'john.doe@example.com', description: 'Email address' })
    @IsEmail()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty({ description: 'Password reset token' })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiProperty({ example: 'NewPassword123!', description: 'New password' })
    @IsString()
    @MinLength(8)
    @MaxLength(100)
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/, {
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    })
    password: string;
}