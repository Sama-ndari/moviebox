import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WatchHistory, WatchHistorySchema } from './entities/watch-history.entity';
import { WatchHistoryService } from './watch-history.service';
import { WatchHistoryController } from './watch-history.controller';
import { MovieModule } from '../movie/movie.module';
import { TvShowModule } from '../tv-show/tv-show.module';
import { SeasonModule } from '../season/season.module';
import { EpisodeModule } from '../episode/episode.module';
import { UserModule } from '../user/user.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WatchHistory.name, schema: WatchHistorySchema }]),
    MovieModule,
    TvShowModule,
    SeasonModule,
    EpisodeModule,
    UserModule,
    NotificationModule,
  ],
  providers: [WatchHistoryService],
  controllers: [WatchHistoryController],
  exports: [WatchHistoryService],
})
export class WatchHistoryModule {}