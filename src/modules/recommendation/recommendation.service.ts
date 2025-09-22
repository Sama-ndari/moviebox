import { Injectable } from '@nestjs/common';
import { MoviesService } from '../movie/movie.service';
import { ResponseService } from '../../helpers/respon-server/ResponseServer';
import { TMDbService } from '../tmdb/tmdb.service';
import { WatchHistoryService } from '../watch-history/watch-history.service';
import { CommonHelpers } from '../../helpers/helpers';

@Injectable()
export class RecommendationService {
    constructor(
        private readonly moviesService: MoviesService,
        private readonly responseService: ResponseService,
        private readonly tmdbService: TMDbService,
        private readonly watchHistoryService: WatchHistoryService,
    ) { }

    async getRecommendations(userId: string) {
        const cacheKey = `recommendations:${userId}`;
        const fetchFn = async () => {
            const historyResponse = await this.watchHistoryService.getHistory(userId);
            if (historyResponse.statusCode !== 200 || historyResponse.data.items.length === 0) {
                const popularMovies = await this.tmdbService.getPopularMovies();
                return popularMovies.results;
            }

            const lastWatched = historyResponse.data.items[0];
            const lastWatchedTmdbId = lastWatched.content.tmdbId;

            if (!lastWatchedTmdbId) {
                const popularMovies = await this.tmdbService.getPopularMovies();
                return popularMovies.results;
            }

            const recommendations = await this.tmdbService.getMovieRecommendations(lastWatchedTmdbId);
            const similarMovies = await this.tmdbService.getSimilarMovies(lastWatchedTmdbId);

            const combined = [...recommendations.results, ...similarMovies.results];
            const uniqueIds = new Set(combined.map(m => m.id));
            const uniqueMovies = Array.from(uniqueIds).map(id => combined.find(m => m.id === id));

            return uniqueMovies;
        };

        try {
            const recommendations = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn, 3600); // Cache for 1 hour
            return this.responseService.responseSuccess(recommendations);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }
}
