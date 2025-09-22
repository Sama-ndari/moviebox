import { Module } from '@nestjs/common';
import { TMDbModule } from '../tmdb/tmdb.module';
import { WatchHistoryModule } from '../watch-history/watch-history.module';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { WatchlistModule } from '../watchlist/watchlist.module';
import { MovieModule } from '../movie/movie.module';

@Module({
  imports: [WatchlistModule, MovieModule, TMDbModule, WatchHistoryModule],
  controllers: [RecommendationController],
  providers: [RecommendationService]
})
export class RecommendationModule {}
