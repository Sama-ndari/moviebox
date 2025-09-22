import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TvShow, TvShowSchema } from './entities/tv-show.entity';
import { Season, SeasonSchema } from '../season/entities/season.entity';
import { Episode, EpisodeSchema } from '../episode/entities/episode.entity';
import { TvShowController } from './tv-show.controller';
import { TvShowService } from './tv-show.service';
import { PersonModule } from '../person/person.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TvShow.name, schema: TvShowSchema },
      { name: Season.name, schema: SeasonSchema },
      { name: Episode.name, schema: EpisodeSchema },
    ]),
    PersonModule, // For cast and crew references
  ],
  controllers: [TvShowController],
  providers: [TvShowService],
  exports: [TvShowService],
})
export class TvShowModule {}