import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, ObjectId } from 'mongoose';
import { Movie } from './entities/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Languages, MovieGenre, MovieRating, MovieStatus } from './entities/enumerate.entity';
import { Person } from 'src/person/entities/person.entity';
import { PersonService } from 'src/person/person.service';

@Injectable()
export class MoviesService {
  constructor(
    @InjectModel(Movie.name) private movieModel: Model<Movie>,
    @Inject(forwardRef(() => PersonService)) private readonly personService: PersonService,
  ) { }

  async create(createMovieDto: CreateMovieDto): Promise<Movie> {
    const createdMovie = new this.movieModel(createMovieDto);
    return createdMovie.save();
  }

  async findAll(page: number, limit: number, genre?: string): Promise<{ movies: Movie[]; total: number }> {
    const skip = (page - 1) * limit;
    const filter: any = {};
    if (genre) filter.genres = genre;

    const [movies, total] = await Promise.all([
      this.movieModel.find(filter).skip(skip).limit(limit).exec(),
      this.movieModel.countDocuments(filter).exec(),
    ]);

    return { movies, total };
  }

  async findOne(id: string): Promise<Movie> {
    const movie = await this.movieModel.findById(id).exec();
    if (!movie) throw new NotFoundException(`Movie with ID ${id} not found`);
    return movie;
  }

  async update(id: string, updateMovieDto: UpdateMovieDto): Promise<Movie> {
    const updatedMovie = await this.movieModel.findByIdAndUpdate(id, updateMovieDto, { new: true }).exec();
    if (!updatedMovie) throw new NotFoundException(`Movie with ID ${id} not found`);
    return updatedMovie;
  }

  async remove(id: string): Promise<void> {
    const result = await this.movieModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Movie with ID ${id} not found`);
  }

  async search(query: string): Promise<Movie[]> {
    return this.movieModel.find({ $text: { $search: query } }).exec();
  }

  async filter(filters: {
    releaseDate?: string;
    genres?: string;
    status?: string;
    contentRating?: string;
    ratingCount?: number;
    duration?: number;
    budget?: number;
    revenue?: number;
    voteAverage?: number;
    voteCount?: number;
    popularity?: number;
    person?: string;
    isActive?: boolean;
    isAdult?: boolean;
    language?: string;
    country?: string;
    productionCompany?: string;
    director?: string;
    writer?: string;
  }): Promise<Movie[]> {
    const query: any = {};

    // Helper function to normalize enum values
    const normalizeEnum = (value: string, enumObj: any): string => {
      const normalized = Object.values(enumObj).find(
        (enumValue) => (enumValue as string).toLowerCase() === value.toLowerCase()
      ) as string | undefined;
      if (!normalized) {
        throw new BadRequestException(`Invalid value: ${value}. Must be one of: ${Object.values(enumObj).join(', ')}`);
      }
      return normalized;
    };

    if (filters.releaseDate) {
      try {
        query.releaseDate = new Date(filters.releaseDate);
      } catch (error) {
        throw new BadRequestException('Invalid releaseDate format. Use YYYY-MM-DD.');
      }
    }

    if (filters.genres) {
      const genresArray = filters.genres.split(',').map((genre) => genre.trim());
      const normalizedGenres = genresArray.map((genre) => normalizeEnum(genre, MovieGenre));
      query.genres = { $in: normalizedGenres };
    }

    if (filters.status) {
      query.status = normalizeEnum(filters.status, MovieStatus);
    }

    if (filters.contentRating) {
      query.contentRating = normalizeEnum(filters.contentRating, MovieRating);
    }

    if (filters.ratingCount) {
      query.ratingCount = { $gte: filters.ratingCount };
    }

    if (filters.duration) {
      query.duration = { $gte: filters.duration };
    }

    if (filters.budget) {
      query.budget = { $gte: filters.budget };
    }

    if (filters.revenue) {
      query.revenue = { $gte: filters.revenue };
    }

    if (filters.voteAverage) {
      query.voteAverage = { $gte: filters.voteAverage };
    }

    if (filters.voteCount) {
      query.voteCount = { $gte: filters.voteCount };
    }

    if (filters.popularity) {
      query.popularity = { $gte: filters.popularity };
    }

    if (filters.person) {
      query.$or = [
        { 'cast.character': { $regex: filters.person, $options: 'i' } },
        { 'crew.role': { $regex: filters.person, $options: 'i' } },
        { directors: { $regex: filters.person, $options: 'i' } },
        { writers: { $regex: filters.person, $options: 'i' } },
      ];
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.isAdult !== undefined) {
      query.isAdult = filters.isAdult;
    }

    if (filters.language) {
      const languagesArray = filters.language.split(',').map((lang) => lang.trim());
      const normalizedLanguages = languagesArray.map((lang) => normalizeEnum(lang, Languages));
      query.languages = { $in: normalizedLanguages };
    }

    if (filters.country) {
      query.country = { $regex: filters.country, $options: 'i' };
    }

    if (filters.productionCompany) {
      query.productionCompany = { $regex: filters.productionCompany, $options: 'i' };
    }

    if (filters.director) {
      query.directors = { $regex: filters.director, $options: 'i' };
    }

    if (filters.writer) {
      query.writers = { $regex: filters.writer, $options: 'i' };
    }

    console.log('Filter query:', JSON.stringify(query, null, 2));

    try {
      return await this.movieModel.find(query).exec();
    } catch (error) {
      console.error('Error executing filter query:', error);
      throw new BadRequestException('Failed to filter movies: ' + error.message);
    }
  }

  async addCast(movieId: string, castMember: { person: string; character: string; order: number }[]): Promise<Movie> {
    const movie = await this.movieModel.findById(movieId).exec();
    if (!movie) throw new NotFoundException(`Movie with ID ${movieId} not found`);

    for (const member of castMember) {
      console.log('Processing cast member:', member.person, member.character, member.order);
      const person = await this.personService.findOne(member.person);
      movie.cast.push({
        person: person._id as unknown as mongoose.Types.ObjectId,
        character: member.character,
        order: member.order,
      });
    }
    return movie.save();
  }

  async removeCast(movieId: string, personId: string): Promise<Movie> {
    const movie = await this.movieModel.findById(movieId).exec();
    if (!movie) throw new NotFoundException(`Movie with ID ${movieId} not found`);

    movie.cast = movie.cast.filter((castMember) => castMember.person.toString() !== personId);
    return movie.save();
  }

  async addCrew(movieId: string, crewMembers: { person: string; role: string; department: string }[]): Promise<Movie> {
    const movie = await this.movieModel.findById(movieId).exec();
    if (!movie) throw new NotFoundException(`Movie with ID ${movieId} not found`);

    for (const member of crewMembers) {
      console.log('Processing crew member:', member.person, member.role, member.department);
      const person = await this.personService.findOne(member.person);
      movie.crew.push({
        person: person._id as unknown as mongoose.Types.ObjectId,
        role: member.role,
        department: member.department,
      });
    }
    return movie.save();
  }

  async removeCrew(movieId: string, personId: string): Promise<Movie> {
    const movie = await this.movieModel.findById(movieId).exec();
    if (!movie) throw new NotFoundException(`Movie with ID ${movieId} not found`);

    movie.crew = movie.crew.filter((crewMember) => crewMember.person.toString() !== personId);
    return movie.save();
  }

  async getCast(movieId: string) {
    const m = await this.movieModel.findById(movieId).populate('cast.person', 'name').lean().exec();
    if (!m) throw new NotFoundException();
    return m.cast;
  }

  async getCrew(movieId: string) {
    const m = await this.movieModel.findById(movieId).populate('crew.person', 'name').lean().exec();
    if (!m) throw new NotFoundException();
    return m.crew;
  }

  async rateMovie(id: string, rating: number) {
    const m = await this.movieModel.findById(id).exec();
    if (!m) throw new NotFoundException();
    // simple average update
    m.voteCount = (m.voteCount || 0) + 1;
    m.voteAverage = ((m.voteAverage || 0) * (m.voteCount - 1) + rating) / m.voteCount;
    return m.save();
  }

  async getTrending(limit: number) { return this.movieModel.find({ isActive: true }).sort({ popularity: -1 }).limit(limit).exec(); }

  async getPopular(limit: number) { return this.movieModel.find().sort({ popularity: -1 }).limit(limit).exec(); }

  async getTopRated(limit: number) { return this.movieModel.find().sort({ voteAverage: -1 }).limit(limit).exec(); }

  async getNowPlaying(limit: number) {
    const today = new Date();
    return this.movieModel.find({ releaseDate: { $lte: today } })
      .sort({ releaseDate: -1 })
      .limit(limit).exec();
  }

  async getUpcoming(limit: number) {
    const today = new Date();
    return this.movieModel.find({ releaseDate: { $gt: today } })
      .sort({ releaseDate: 1 })
      .limit(limit).exec();
  }

  async getRecommendations(movieId: string, limit: number) {
    const base = await this.movieModel.findById(movieId).lean().exec();
    if (!base) throw new NotFoundException();
    // simple “same genre” example:
    return this.movieModel
      .find({ _id: { $ne: movieId }, genres: { $in: base.genres } })
      .limit(limit)
      .exec();
  }


}