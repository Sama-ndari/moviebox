import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean, IsDate, MinLength } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
    @IsString()
    username: string;

    @IsEmail()
    email: string;

    @IsString()
    @MinLength(6)
    password: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsString()
    profileImageUrl?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    @MinLength(6)
    password?: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsString()
    profileImageUrl?: string;

    @IsOptional()
    @IsString()
    bio?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsDate()
    lastLogin?: Date;
}

export class QueryUsersDto {
    @IsOptional()
    @IsString()
    username?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsString()
    sortBy?: string;

    @IsOptional()
    @IsString()
    sortDirection?: 'asc' | 'desc';

    @IsOptional()
    @IsString()
    page?: number;

    @IsOptional()
    @IsString()
    limit?: number;
}