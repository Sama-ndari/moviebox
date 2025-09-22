import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Follow, FollowSchema } from './entities/follow.entity';
import { FollowService } from './follow.service';

@Module({
  imports: [MongooseModule.forFeature([{ name: Follow.name, schema: FollowSchema }])],
  providers: [FollowService],
  exports: [FollowService],
})
export class FollowModule {}
