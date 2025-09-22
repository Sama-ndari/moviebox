import { IsString, IsEnum, IsOptional, IsBoolean, IsDateString, IsMongoId, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsMongoId()
  @ApiProperty({ description: 'ID of the user to notify', example: '60d21b4667d0d8992e610c89' })
  userId: string;

  @IsString()
  @ApiProperty({ description: 'Notification message', example: 'New episode available!' })
  message: string;

  @IsEnum(NotificationType)
  @ApiProperty({ description: 'Type of notification', enum: NotificationType, example: NotificationType.GENERAL })
  type: NotificationType;

  @IsOptional()
  @IsMongoId()
  @ApiProperty({ description: 'ID of the user who triggered the notification', required: false })
  senderId?: string;

  @IsOptional()
  @IsEnum(['High', 'Medium', 'Low'])
  @ApiProperty({ description: 'Priority level', example: 'High', default: 'Medium' })
  priority?: string;

  @IsOptional()
  @IsEnum(['InApp', 'Email', 'Both'])
  @ApiProperty({ description: 'Delivery method', example: 'Both', default: 'InApp' })
  deliveryMethod?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ description: 'Expiration date for the notification', example: '2025-05-15T23:59:59Z' })
  expiresAt?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Link to related content', example: '/watchlist/60d21b4667d0d8992e610c89' })
  relatedLink?: string;
}

export class MarkNotificationReadDto {
  @IsMongoId()
  @ApiProperty({ description: 'ID of the notification to mark as read', example: '60d21b4667d0d8992e610c90' })
  notificationId: string;
}

export class BatchNotificationDto {
  @IsArray()
  @IsMongoId({ each: true })
  @ApiProperty({ description: 'Array of user IDs to notify', example: ['60d21b4667d0d8992e610c89', '60d21b4667d0d8992e610c90'] })
  userIds: string[];

  @IsString()
  @ApiProperty({ description: 'Notification message', example: 'You’re invited to a watch party!' })
  message: string;

  @IsOptional()
  @IsEnum(['High', 'Medium', 'Low'])
  @ApiProperty({ description: 'Priority level', example: 'High', default: 'Medium' })
  priority?: string;

  @IsOptional()
  @IsEnum(['InApp', 'Email', 'Both'])
  @ApiProperty({ description: 'Delivery method', example: 'Both', default: 'InApp' })
  deliveryMethod?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ description: 'Expiration date for the notification', example: '2025-05-15T23:59:59Z' })
  expiresAt?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Link to related content', example: '/watchlist/60d21b4667d0d8992e610c89' })
  relatedLink?: string;
}