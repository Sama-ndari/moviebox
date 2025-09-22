import { Injectable, NotFoundException, forwardRef, Inject, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Movie } from './entities/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PersonService } from '../person/person.service';
import { TMDbService } from '../tmdb/tmdb.service';
import { HttpService } from '@nestjs/axios';
import * as fs from 'fs';
import * as path from 'path';
import { CreateMovieFromTMDbDto } from './dto/create-from-tmdb.dto';
import { MovieGenre, MovieRating, MovieStatus } from './entities/enumerate.entity';
import { CommonHelpers } from '../../helpers/helpers';
import { ResponseService } from '../../helpers/respon-server/ResponseServer';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class MoviesService {
  constructor(
    @InjectModel(Movie.name) private readonly movieModel: Model<Movie>,
    @Inject(forwardRef(() => PersonService)) private readonly personService: PersonService,
    private readonly tmdbService: TMDbService,
    private readonly httpService: HttpService,
    private readonly responseService: ResponseService,
    private readonly jobsService: JobsService,
  ) { }

    async create(createMovieDto: CreateMovieDto) {
        try {
            const createdMovie = new this.movieModel(createMovieDto);
            const savedMovie = await CommonHelpers.retry(() => createdMovie.save());
            await CommonHelpers.invalidateCacheByPattern('movies:*');
            return this.responseService.responseCreateSuccess('Movie created successfully', savedMovie);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async updateByTmdbId(tmdbId: number, updateDto: Partial<Movie>) {
        const movie = await this.movieModel.findOneAndUpdate({ tmdbId }, { $set: updateDto }, { new: true }).exec();
        if (movie) {
            await CommonHelpers.invalidateCache([`movie:${movie._id}`]);
        }
        return movie;
    }

    async createFromTMDb(dto: CreateMovieFromTMDbDto) {
        const { tmdbId, title } = dto;
        if (!tmdbId && !title) {
            throw new BadRequestException('Either tmdbId or title must be provided.');
        }

        let movieId: number;
        if (tmdbId) {
            movieId = tmdbId;
        } else if (title) {
            const searchResults = await this.tmdbService.searchMovie(title);
            if (!searchResults.results || searchResults.results.length === 0) {
                throw new NotFoundException(`Movie with title '${title}' not found on TMDb.`);
            }
            movieId = searchResults.results[0].id;
        } else {
            throw new BadRequestException('Either tmdbId or title must be provided.');
        }

        const existingMovie = await this.movieModel.findOne({ tmdbId: movieId }).exec();
        if (existingMovie) {
            return this.responseService.responseSuccess(existingMovie);
        }

        const movieDetails = await this.tmdbService.getMovieDetails(movieId);
        const movieCredits = await this.tmdbService.getMovieCredits(movieId);

        if (movieDetails.poster_path) {
            const imageName = `${movieId}_${path.basename(movieDetails.poster_path)}`;
            await this.jobsService.addImageDownloadJob({
                imageUrl: `https://image.tmdb.org/t/p/original${movieDetails.poster_path}`,
                tmdbId: movieId,
                type: 'poster',
                imagePath: `/posters/${imageName}`,
            });
        }

        if (movieDetails.backdrop_path) {
            const imageName = `${movieId}_${path.basename(movieDetails.backdrop_path)}`;
            await this.jobsService.addImageDownloadJob({
                imageUrl: `https://image.tmdb.org/t/p/original${movieDetails.backdrop_path}`,
                tmdbId: movieId,
                type: 'backdrop',
                imagePath: `/backdrops/${imageName}`,
            });
        }

        const director = movieCredits.crew.find(c => c.job === 'Director');
        const writers = movieCredits.crew.filter(c => c.department === 'Writing').map(w => w.name);
        const cast = movieCredits.cast.slice(0, 10);

        const castIds = await Promise.all(cast.map(async (member) => {
            const personResponse = await this.personService.createFromTMDb({ tmdbId: member.id });
            return { person: personResponse.data._id, character: member.character, order: member.order };
        }));

        const crewIds: { person: string; role: string; department: string; }[] = [];
        if (director) {
            const directorResponse = await this.personService.createFromTMDb({ tmdbId: director.id });
            crewIds.push({ person: directorResponse.data._id, role: 'Director', department: 'Directing' });
        }

        const createMovieDto: CreateMovieDto = {
            title: movieDetails.title,
            description: movieDetails.overview,
            releaseDate: movieDetails.release_date,
            genres: movieDetails.genres.map(g => g.name.replace('Science Fiction', 'Sci-Fi')) as MovieGenre[],
            status: movieDetails.status.toUpperCase().replace(' ', '_') as MovieStatus,
            posterUrl: '', // Will be updated by the background job
            backdropUrl: '', // Will be updated by the background job,
            trailerUrl: '',
            contentRating: MovieRating.UNRATED,
            duration: movieDetails.runtime,
            isFeatured: false,
            isActive: true,
            streamingUrl: '',
            isAdult: movieDetails.adult,
            directors: director ? [director.name] : [],
            writers: writers,
            cast: castIds,
            crew: crewIds,
            tmdbId: movieDetails.id,
        };

        return this.create(createMovieDto);
    }


  async findAll(page: number, limit: number, genre?: string) {
    const cacheKey = `movies:popular:${page}:${limit}`;
    const fetchFn = async () => {
      const tmdbMovies = await this.tmdbService.getPopularMovies(page);
      const tmdbIds = tmdbMovies.results.map((movie) => movie.id);

      const localMovies = await this.movieModel.find({ tmdbId: { $in: tmdbIds } }).exec();
      const localMoviesMap = new Map(localMovies.map((movie) => [movie.tmdbId, movie]));

      const mergedMovies = tmdbMovies.results.map((tmdbMovie) => {
        const localMovie = localMoviesMap.get(tmdbMovie.id);
        return {
          ...tmdbMovie,
          ...(localMovie ? localMovie.toObject() : {}),
        };
      });

      return { 
        items: mergedMovies.slice(0, limit),
        meta: {
          totalItems: tmdbMovies.total_results,
          itemCount: mergedMovies.length,
          itemsPerPage: limit,
          totalPages: tmdbMovies.total_pages,
          currentPage: page,
        }
      };
    };

    try {
      const data = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn, 3600); // Cache for 1 hour
      return this.responseService.responseSuccess(data);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async findOne(id: string) {
    const cacheKey = `movie:${id}`;
    const fetchFn = async () => {
      const movie = await this.movieModel.findById(id).populate('cast.person').populate('crew.person').exec();
      if (!movie) throw new NotFoundException(`Movie with ID ${id} not found`);
      return movie;
    };
    try {
      const movie = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
      return this.responseService.responseSuccess(movie);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async update(id: string, updateMovieDto: UpdateMovieDto) {
    try {
      const updatedMovie = await CommonHelpers.retry(() => this.movieModel.findByIdAndUpdate(id, updateMovieDto, { new: true }).exec());
      if (!updatedMovie) throw new NotFoundException(`Movie with ID ${id} not found`);
      await CommonHelpers.invalidateCache([`movie:${id}`]);
      await CommonHelpers.invalidateCacheByPattern('movies:*');
      return this.responseService.responseUpdateSuccess('Movie updated successfully', updatedMovie);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async remove(id: string) {
    try {
      const result = await CommonHelpers.retry(() => this.movieModel.findByIdAndDelete(id).exec());
      if (!result) throw new NotFoundException(`Movie with ID ${id} not found`);
      await CommonHelpers.invalidateCache([`movie:${id}`]);
      await CommonHelpers.invalidateCacheByPattern('movies:*');
      return this.responseService.responseDeleteSuccess('Movie deleted successfully', null);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async search(query: string) {
    const cacheKey = `movies:search:${query}`;
    const fetchFn = () => this.movieModel.find({ $text: { $search: query } }).exec();
    try {
      const movies = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
      return this.responseService.responseSuccess(movies);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async filter(filters: any) {
    const cacheKey = `movies:filter:${JSON.stringify(filters)}`;
    const fetchFn = async () => {
      const query: any = {};
      // ... [filter logic as before]
      const movies = await this.movieModel.find(query).exec();
      return movies;
    };
    try {
      const data = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
      return this.responseService.responseSuccess(data);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async addCast(movieId: string, castMember: { person: string; character: string; order: number }[]) {
    try {
      const movie = await this.movieModel.findById(movieId).exec();
      if (!movie) throw new NotFoundException(`Movie with ID ${movieId} not found`);
      for (const member of castMember) {
        const personResponse = await this.personService.findOne(member.person);
        if (personResponse.statusCode !== 200) throw new NotFoundException(`Person with ID ${member.person} not found`);
        const person = personResponse.data;
        movie.cast.push({
          person: person._id as any,
          character: member.character,
          order: member.order,
        });
      }
      const savedMovie = await CommonHelpers.retry(() => movie.save());
      await CommonHelpers.invalidateCache([`movie:${movieId}`]);
      await CommonHelpers.invalidateCacheByPattern('movies:*');
      return this.responseService.responseUpdateSuccess('Cast added successfully', savedMovie);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async removeCast(movieId: string, personId: string) {
    try {
      const movie = await this.movieModel.findById(movieId).exec();
      if (!movie) throw new NotFoundException(`Movie with ID ${movieId} not found`);

      movie.cast = movie.cast.filter((castMember) => castMember.person.toString() !== personId);
      const savedMovie = await CommonHelpers.retry(() => movie.save());
      await CommonHelpers.invalidateCache([`movie:${movieId}`]);
      await CommonHelpers.invalidateCacheByPattern('movies:*');
      return this.responseService.responseUpdateSuccess('Cast removed successfully', savedMovie);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async addCrew(movieId: string, crewMembers: { person: string; role: string; department: string }[]) {
    try {
      const movie = await this.movieModel.findById(movieId).exec();
      if (!movie) throw new NotFoundException(`Movie with ID ${movieId} not found`);

      for (const member of crewMembers) {
        const personResponse = await this.personService.findOne(member.person);
        if (personResponse.statusCode !== 200) throw new NotFoundException(`Person with ID ${member.person} not found`);
        const person = personResponse.data;
        movie.crew.push({
          person: person._id as any,
          role: member.role,
          department: member.department,
        });
      }
      const savedMovie = await CommonHelpers.retry(() => movie.save());
      await CommonHelpers.invalidateCache([`movie:${movieId}`]);
      await CommonHelpers.invalidateCacheByPattern('movies:*');
      return this.responseService.responseUpdateSuccess('Crew added successfully', savedMovie);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async removeCrew(movieId: string, personId: string) {
    try {
      const movie = await this.movieModel.findById(movieId).exec();
      if (!movie) throw new NotFoundException(`Movie with ID ${movieId} not found`);

      movie.crew = movie.crew.filter((crewMember) => crewMember.person.toString() !== personId);
      const savedMovie = await CommonHelpers.retry(() => movie.save());
      await CommonHelpers.invalidateCache([`movie:${movieId}`]);
      await CommonHelpers.invalidateCacheByPattern('movies:*');
      return this.responseService.responseUpdateSuccess('Crew removed successfully', savedMovie);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async getCast(movieId: string) {
    const cacheKey = `movie:${movieId}:cast`;
    const fetchFn = async () => {
      const m = await this.movieModel.findById(movieId).populate('cast.person', 'name').lean().exec();
      if (!m) throw new NotFoundException();
      return m.cast;
    };

    try {
      const cast = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
      return this.responseService.responseSuccess(cast);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async rateMovie(id: string, rating: number) {
    try {
      const movie = await this.movieModel.findById(id).exec();
      if (!movie) throw new NotFoundException(`Movie with ID ${id} not found`);
      movie.voteCount = (movie.voteCount || 0) + 1;
      movie.voteAverage = ((movie.voteAverage || 0) * (movie.voteCount - 1) + rating) / movie.voteCount;
      const savedMovie = await CommonHelpers.retry(() => movie.save());
      await CommonHelpers.invalidateCache([`movie:${id}`]);
      return this.responseService.responseUpdateSuccess('Movie rated successfully', savedMovie);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async getCrew(movieId: string) {
    const cacheKey = `movie:${movieId}:crew`;
    const fetchFn = async () => {
      const m = await this.movieModel.findById(movieId).populate('crew.person', 'name').lean().exec();
      if (!m) throw new NotFoundException();
      return m.crew;
    };

    try {
      const crew = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
      return this.responseService.responseSuccess(crew);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async getTrending(limit: number) {
    const cacheKey = `movies:trending:${limit}`;
    const fetchFn = () => this.movieModel.find({ isActive: true }).sort({ popularity: -1 }).limit(limit).exec();
    const movies = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn, 3600);
    return this.responseService.responseSuccess(movies);
  }

  async getPopular(limit: number) {
    const cacheKey = `movies:popular:${limit}`;
    const fetchFn = () => this.movieModel.find().sort({ popularity: -1 }).limit(limit).exec();
    const movies = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn, 3600);
    return this.responseService.responseSuccess(movies);
  }

  async getTopRated(limit: number) {
    const cacheKey = `movies:top-rated:${limit}`;
    const fetchFn = () => this.movieModel.find().sort({ voteAverage: -1 }).limit(limit).exec();
    const movies = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn, 3600);
    return this.responseService.responseSuccess(movies);
  }

  async getNowPlaying(limit: number) {
    const cacheKey = `movies:now-playing:${limit}`;
    const fetchFn = () => {
      const today = new Date();
      return this.movieModel.find({ releaseDate: { $lte: today } })
        .sort({ releaseDate: -1 })
        .limit(limit).exec();
    };
    const movies = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn, 3600);
    return this.responseService.responseSuccess(movies);
  }

  async getUpcoming(limit: number) {
    const cacheKey = `movies:upcoming:${limit}`;
    const fetchFn = () => {
      const today = new Date();
      return this.movieModel.find({ releaseDate: { $gt: today } })
        .sort({ releaseDate: 1 })
        .limit(limit).exec();
    };
    const movies = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn, 3600);
    return this.responseService.responseSuccess(movies);
  }

  async getRecommendations(movieId: string, limit: number) {
    try {
      const baseResponse = await this.findOne(movieId);
      if (baseResponse.statusCode !== 200) throw new NotFoundException();
      const base = baseResponse.data;

      const movies = await CommonHelpers.retry(() => this.movieModel
        .find({ _id: { $ne: movieId }, genres: { $in: base.genres } })
        .limit(limit)
        .exec());
      return this.responseService.responseSuccess(movies);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }
}