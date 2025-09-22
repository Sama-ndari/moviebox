import { Controller, Post, Get, Put, Body, UseGuards, Req, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationService } from './notification.service';
import { CreateNotificationDto, MarkNotificationReadDto, BatchNotificationDto } from './dto/notification.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Notifications')
@Controller('notifications')
// @UseGuards(AuthGuard('jwt'))
// @ApiBearerAuth('JWT')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a notification for a user' })
  @ApiResponse({ status: 201, description: 'Notification created' })
  async createNotification(@Body() dto: CreateNotificationDto, @Req() req: any) {
    return this.notificationService.notifyUser(dto);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Create notifications for multiple users' })
  @ApiResponse({ status: 201, description: 'Batch notifications created' })
  async createBatchNotification(@Body() dto: BatchNotificationDto, @Req() req: any) {
    return this.notificationService.notifyUsers(dto);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'User notifications' })
  @ApiParam({ name: 'userId', required: true, description: 'ID of the user' })
  async getNotifications(@Param('userId') userId: string) {
    return this.notificationService.getNotifications(userId);
  }

  @Put(':userId/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiParam({ name: 'userId', required: true, description: 'ID of the user' })
  async markNotificationRead(
    @Param('userId') userId: string,
    @Body() dto: MarkNotificationReadDto
  ) {
    return this.notificationService.markNotificationRead(userId, dto);
  }
}