import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './entities/notification.entity';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
    forwardRef(() => UserModule),
  ],
  providers: [NotificationService, NotificationGateway],
  controllers: [NotificationController],
  exports: [NotificationService],
})
export class NotificationModule {}