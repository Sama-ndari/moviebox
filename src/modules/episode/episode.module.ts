import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Episode, EpisodeSchema } from './entities/episode.entity';
import { EpisodeController } from './episode.controller';
import { EpisodeService } from './episode.service';
import { SeasonModule } from '../season/season.module';
import { TvShowModule } from '../tv-show/tv-show.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Episode.name, schema: EpisodeSchema }]),
    TvShowModule, // For season references and validation
    forwardRef(() => SeasonModule), // For TV show-related queries and recommendations
  ],
  controllers: [EpisodeController],
  providers: [EpisodeService],
  exports: [EpisodeService],
})
export class EpisodeModule {}