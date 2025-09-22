import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { ImageJobProcessor } from './image-job.processor';
import { MovieModule } from '../movie/movie.module';
import { PersonModule } from '../person/person.module';
import { NotificationModule } from '../notification/notification.module';
import { FollowModule } from '../follow/follow.module';
import { UserModule } from '../user/user.module';
import { TMDbModule } from '../tmdb/tmdb.module';
import { JobsService } from './jobs.service';
import { NotificationJobProcessor } from './notification-job.processor';
import { Person, PersonSchema } from '../person/entities/person.entity';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'image-processing' }),
    BullModule.registerQueue({ name: 'notification-processing' }),
    HttpModule,
    forwardRef(() => MovieModule),
    forwardRef(() => PersonModule),
    NotificationModule,
    FollowModule,
    UserModule,
    TMDbModule,
  ],
  providers: [JobsService, ImageJobProcessor, NotificationJobProcessor],
  exports: [JobsService],
})
export class JobsModule {}
