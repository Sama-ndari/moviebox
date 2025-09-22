import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Movie } from '../movie/entities/movie.entity';
import { TvShow } from '../tv-show/entities/tv-show.entity';
import { Person } from '../person/entities/person.entity';
import { ResponseService } from '../../helpers/respon-server/ResponseServer';
import { TMDbService } from '../tmdb/tmdb.service';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Movie.name) private readonly movieModel: Model<Movie>,
    @InjectModel(TvShow.name) private readonly tvShowModel: Model<TvShow>,
    @InjectModel(Person.name) private readonly personModel: Model<Person>,
    private readonly responseService: ResponseService,
    private readonly tmdbService: TMDbService,
  ) { }

  async search(query: string, page: number = 1) {
    try {
      const searchResults = await this.tmdbService.multiSearch(query, page);

      const movieIds = searchResults.results.filter(r => r.media_type === 'movie').map(r => r.id);
      const tvShowIds = searchResults.results.filter(r => r.media_type === 'tv').map(r => r.id);
      const personIds = searchResults.results.filter(r => r.media_type === 'person').map(r => r.id);

      const localMovies = await this.movieModel.find({ tmdbId: { $in: movieIds } }).exec();
      const localTvShows = await this.tvShowModel.find({ tmdbId: { $in: tvShowIds } }).exec();
      const localPeople = await this.personModel.find({ tmdbId: { $in: personIds } }).exec();

      const localMoviesMap = new Map(localMovies.map((m: any) => [m.tmdbId, m]));
      const localTvShowsMap = new Map(localTvShows.map((t: any) => [t.tmdbId, t]));
      const localPeopleMap = new Map(localPeople.map((p: any) => [p.tmdbId, p]));

      const mergedResults = searchResults.results.map(result => {
        if (result.media_type === 'movie') {
          const localMovie = localMoviesMap.get(result.id);
          return { ...result, ...(localMovie ? localMovie.toObject() : {}) };
        } else if (result.media_type === 'tv') {
          const localTvShow = localTvShowsMap.get(result.id);
          return { ...result, ...(localTvShow ? localTvShow.toObject() : {}) };
        } else if (result.media_type === 'person') {
          const localPerson = localPeopleMap.get(result.id);
          return { ...result, ...(localPerson ? localPerson.toObject() : {}) };
        }
        return result;
      });

      return this.responseService.responseSuccess({ 
        items: mergedResults,
        meta: {
            totalItems: searchResults.total_results,
            itemCount: mergedResults.length,
            itemsPerPage: 20, // TMDb default
            totalPages: searchResults.total_pages,
            currentPage: page,
        }
      });
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }
}