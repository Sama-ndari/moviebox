import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Season, SeasonSchema } from './entities/season.entity';
import { SeasonController } from './season.controller';
import { SeasonService } from './season.service';
import { TvShowModule } from '../tv-show/tv-show.module';
import { EpisodeModule } from '../episode/episode.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Season.name, schema: SeasonSchema }]),
    TvShowModule, // For TV show references and validation
    forwardRef(() => EpisodeModule), // For episode population
  ],
  controllers: [SeasonController],
  providers: [SeasonService],
  exports: [SeasonService],
})
export class SeasonModule {}