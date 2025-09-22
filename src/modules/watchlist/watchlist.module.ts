// src/watchlist/watchlist.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WatchlistItem, WatchlistItemSchema } from './entities/watchlist.entity';
import { WatchlistService } from './watchlist.service';
import { WatchlistController } from './watchlist.controller';
import { MovieModule } from '../movie/movie.module';
import { TvShowModule } from '../tv-show/tv-show.module';
import { SeasonModule } from '../season/season.module';
import { EpisodeModule } from '../episode/episode.module';
import { UserModule } from '../user/user.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WatchlistItem.name, schema: WatchlistItemSchema }]),
    MovieModule,
    TvShowModule,
    SeasonModule,
    EpisodeModule,
    UserModule,
    NotificationModule,
  ],
  providers: [WatchlistService],
  exports: [WatchlistService],
  controllers: [WatchlistController],
})
export class WatchlistModule {}