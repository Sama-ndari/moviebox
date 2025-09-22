import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { TvShow } from './entities/tv-show.entity';
import { Season } from '../season/entities/season.entity';
import { Episode } from '../episode/entities/episode.entity';
import { PersonService } from '../person/person.service';
import { UpdateEpisodeDto } from '../episode/dto/create-episode.dto';
import { UpdateSeasonDto } from '../season/dto/create-season.dto';
import { CreateTvShowDto, QueryTvShowDto, UpdateTvShowDto } from './dto/create-tv-show.dto';
import { SeasonService } from '../season/season.service';
import { CommonHelpers } from '../../helpers/helpers';
import { ResponseService } from '../../helpers/respon-server/ResponseServer';

@Injectable()
export class TvShowService {
  constructor(
    @InjectModel(TvShow.name) private tvShowModel: Model<TvShow>,
    @InjectModel(Season.name) private seasonModel: Model<Season>,
    @InjectModel(Episode.name) private episodeModel: Model<Episode>,
    private readonly personService: PersonService,
    private readonly responseService: ResponseService,
  ) { }

  async create(createTvShowDto: CreateTvShowDto) {
    try {
      const createdTvShow = new this.tvShowModel({
        ...createTvShowDto,
        releaseDate: new Date(createTvShowDto.releaseDate),
        endDate: createTvShowDto.endDate ? new Date(createTvShowDto.endDate) : undefined,
      });
      const savedTvShow = await CommonHelpers.retry(() => createdTvShow.save());
      await CommonHelpers.invalidateCacheByPattern('tv-shows:*');
      return this.responseService.responseCreateSuccess('TV show created successfully', savedTvShow);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async findAll(queryDto: QueryTvShowDto) {
    const cacheKey = `tv-shows:all:${JSON.stringify(queryDto)}`;
    const fetchFn = async () => {
      const { page = 1, limit = 10, genre, search, sortBy = 'popularity', sortOrder = 'desc', releaseDate, country } = queryDto;
      const skip = (page - 1) * limit;
      const query: any = {};

      if (genre) query.genres = genre;
      if (search) query.$text = { $search: search };
      if (releaseDate) query.releaseDate = { $gte: new Date(releaseDate) };
      if (country) query.country = { $regex: country, $options: 'i' };

      const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

      const [items, totalCount] = await Promise.all([
        this.tvShowModel.find(query).sort(sort).skip(skip).limit(limit).populate('seasons').exec(),
        this.tvShowModel.countDocuments(query).exec(),
      ]);

      return { items, meta: { totalItems: totalCount, itemCount: items.length, itemsPerPage: limit, totalPages: Math.ceil(totalCount / limit), currentPage: page } };
    };

    try {
      const data = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
      return this.responseService.responseSuccess(data);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async findOne(id: string) {
    if (!Types.ObjectId.isValid(id)) return this.responseService.responseError(`Invalid TV show ID: ${id}`);
    const cacheKey = `tv-show:${id}`;
    const fetchFn = async () => {
      const tvShow = await this.tvShowModel.findById(id).populate('seasons cast.person crew.person').exec();
      if (!tvShow) throw new NotFoundException(`TV show with ID ${id} not found`);
      return tvShow;
    };

    try {
      const tvShow = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
      return this.responseService.responseSuccess(tvShow);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async update(id: string, updateTvShowDto: UpdateTvShowDto) {
    if (!Types.ObjectId.isValid(id)) return this.responseService.responseError(`Invalid TV show ID: ${id}`);
    try {
      const updateData = {
        ...updateTvShowDto,
        releaseDate: updateTvShowDto.releaseDate ? new Date(updateTvShowDto.releaseDate) : undefined,
        endDate: updateTvShowDto.endDate ? new Date(updateTvShowDto.endDate) : undefined,
      };
      const updatedTvShow = await CommonHelpers.retry(() => this.tvShowModel.findByIdAndUpdate(id, updateData, { new: true }).exec());
      if (!updatedTvShow) throw new NotFoundException(`TV show with ID ${id} not found`);

      await CommonHelpers.invalidateCache([`tv-show:${id}`]);
      await CommonHelpers.invalidateCacheByPattern('tv-shows:*');
      return this.responseService.responseUpdateSuccess('TV show updated successfully', updatedTvShow);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) return this.responseService.responseError(`Invalid TV show ID: ${id}`);
    const session = await this.tvShowModel.db.startSession();
    session.startTransaction();

    try {
      const tvShow = await this.tvShowModel.findById(id).session(session).exec();
      if (!tvShow) throw new NotFoundException(`TV show with ID ${id} not found`);

      const seasons = await this.seasonModel.find({ tvShow: id }).session(session).exec();
      for (const season of seasons) {
        await this.episodeModel.deleteMany({ season: season._id }).session(session).exec();
      }
      await this.seasonModel.deleteMany({ tvShow: id }).session(session).exec();
      await this.tvShowModel.findByIdAndDelete(id).session(session).exec();

      await session.commitTransaction();

      await CommonHelpers.invalidateCache([`tv-show:${id}`]);
      await CommonHelpers.invalidateCacheByPattern('tv-shows:*');
      await CommonHelpers.invalidateCacheByPattern('seasons:*');
      await CommonHelpers.invalidateCacheByPattern('episodes:*');
      return this.responseService.responseDeleteSuccess('TV show and all related seasons and episodes deleted successfully', null);
    } catch (error) {
      await session.abortTransaction();
      return this.responseService.responseError(error.message);
    } finally {
      session.endSession();
    }
  }

  async rateTvShow(id: string, rating: number) {
    if (!Types.ObjectId.isValid(id)) return this.responseService.responseError(`Invalid TV show ID: ${id}`);
    if (rating < 0 || rating > 5) return this.responseService.responseError('Rating must be between 0 and 5');

    try {
      const tvShow = await this.tvShowModel.findById(id).exec();
      if (!tvShow) throw new NotFoundException(`TV show with ID ${id} not found`);

      tvShow.ratingCount = (tvShow.ratingCount || 0) + 1;
      tvShow.averageRating = ((tvShow.averageRating || 0) * (tvShow.ratingCount - 1) + rating) / tvShow.ratingCount;
      const savedTvShow = await CommonHelpers.retry(() => tvShow.save());

      await CommonHelpers.invalidateCache([`tv-show:${id}`]);
      await CommonHelpers.invalidateCacheByPattern('tv-shows:*');
      return this.responseService.responseUpdateSuccess('TV show rated successfully', savedTvShow);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async getRecommendations(id: string, limit: number) {
    const cacheKey = `tv-shows:recommendations:${id}:${limit}`;
    const fetchFn = async () => {
      const tvShowResponse = await this.findOne(id);
      if (tvShowResponse.statusCode !== 200) throw new NotFoundException(`TV show with ID ${id} not found`);
      const tvShow = tvShowResponse.data;

      return this.tvShowModel.find({ _id: { $ne: id }, genres: { $in: tvShow.genres } }).sort({ popularity: -1 }).limit(limit).exec();
    };

    try {
      const recommendations = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
      return this.responseService.responseSuccess(recommendations);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async getTrending(limit: number) {
    const cacheKey = `tv-shows:trending:${limit}`;
    const fetchFn = () => this.tvShowModel.find({ isActive: true }).sort({ popularity: -1 }).limit(limit).exec();

    try {
      const tvShows = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn, 3600);
      return this.responseService.responseSuccess(tvShows);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async getSeasons(tvShowId: string) {
    const cacheKey = `tv-show:${tvShowId}:seasons`;
    const fetchFn = async () => {
      if (!Types.ObjectId.isValid(tvShowId)) throw new BadRequestException(`Invalid TV show ID: ${tvShowId}`);
      const tvShow = await this.tvShowModel.findById(tvShowId).populate('seasons').exec();
      if (!tvShow) throw new NotFoundException(`TV show with ID ${tvShowId} not found`);
      return tvShow.seasons;
    };

    try {
      const seasons = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
      return this.responseService.responseSuccess(seasons);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async getSeason(seasonId: string) {
    if (!Types.ObjectId.isValid(seasonId)) return this.responseService.responseError(`Invalid season ID: ${seasonId}`);
    const season = await this.seasonModel.findById(seasonId).populate('episodes').exec();
    if (!season) throw new NotFoundException(`Season with ID ${seasonId} not found`);
    return this.responseService.responseSuccess(season);
  }

  async updateSeason(seasonId: string, updateSeasonDto: UpdateSeasonDto) {
    if (!Types.ObjectId.isValid(seasonId)) return this.responseService.responseError(`Invalid season ID: ${seasonId}`);
    const updateData = {
      ...updateSeasonDto,
      releaseDate: updateSeasonDto.releaseDate ? new Date(updateSeasonDto.releaseDate) : undefined,
    };
    const updatedSeason = await this.seasonModel.findByIdAndUpdate(seasonId, updateData, { new: true }).exec();
    if (!updatedSeason) throw new NotFoundException(`Season with ID ${seasonId} not found`);
    const savedSeason = await CommonHelpers.retry(() => updatedSeason.save());
    await CommonHelpers.invalidateCacheByPattern('tv-shows:*');
    return this.responseService.responseUpdateSuccess('Season updated successfully', savedSeason);
  }

  async addSeason(tvShowId: string, seasonId: string, options: { session?: ClientSession } = {}): Promise<void> {
    if (!Types.ObjectId.isValid(tvShowId)) {
      throw new BadRequestException(`Invalid TV show ID: ${tvShowId}`);
    }
    if (!Types.ObjectId.isValid(seasonId)) {
      throw new BadRequestException(`Invalid season ID: ${seasonId}`);
    }

    const sessionOptions = options.session ? { session: options.session } : {};

    try {
      const result = await this.tvShowModel.updateOne(
        { _id: new Types.ObjectId(tvShowId) },
        { $addToSet: { seasons: new Types.ObjectId(seasonId) } },
        sessionOptions
      );

      if (result.matchedCount === 0) {
        throw new NotFoundException(`TV show with ID ${tvShowId} not found`);
      }

      // Invalidate relevant caches if not in a transaction
      if (!options.session) {
        await CommonHelpers.invalidateCache([`tv-show:${tvShowId}`]);
        await CommonHelpers.invalidateCacheByPattern('tv-shows:*');
      }
    } catch (error) {
      throw new InternalServerErrorException(`Failed to add season to TV show: ${error.message}`);
    }
  }

  async removeSeason(tvShowId: string, seasonId: string, options: { session?: ClientSession } = {}) {
    if (!Types.ObjectId.isValid(tvShowId)) return this.responseService.responseError(`Invalid TV show ID: ${tvShowId}`);
    if (!Types.ObjectId.isValid(seasonId)) return this.responseService.responseError(`Invalid season ID: ${seasonId}`);

    const sessionOptions = options.session ? { session: options.session } : {};

    try {
      const tvShow = await this.tvShowModel.findById(tvShowId);
      if (!tvShow) throw new NotFoundException(`TV show with ID ${tvShowId} not found`);

      // Check if the season exists in the TV show
      const seasonIndex = tvShow.seasons.findIndex(s => s.toString() === seasonId);
      if (seasonIndex === -1) {
        throw new NotFoundException(`Season with ID ${seasonId} not found in TV show ${tvShowId}`);
      }

      // Remove the season from the TV show
      tvShow.seasons.splice(seasonIndex, 1);
      await tvShow.save(sessionOptions);

      // Invalidate relevant caches if not in a transaction
      if (!options.session) {
        await CommonHelpers.invalidateCache([`tv-show:${tvShowId}`]);
        await CommonHelpers.invalidateCacheByPattern('tv-shows:*');
      }

      return this.responseService.responseSuccess('Season removed successfully');
    } catch (error) {
      throw new InternalServerErrorException(`Failed to remove season: ${error.message}`);
    }
  }

  async addEpisode(seasonId: string, createEpisodeDto: any) {
    if (!Types.ObjectId.isValid(seasonId)) return this.responseService.responseError(`Invalid season ID: ${seasonId}`);
    const season = await this.seasonModel.findById(seasonId).exec();
    if (!season) throw new NotFoundException(`Season with ID ${seasonId} not found`);

    const episode = new this.episodeModel({
      ...createEpisodeDto,
      releaseDate: new Date(createEpisodeDto.releaseDate),
      season: seasonId,
    });
    const savedEpisode = await episode.save();

    // Push the episode ID as ObjectId to match the Season entity type
    season.episodes.push(savedEpisode._id as Types.ObjectId);
    await season.save();

    await this.tvShowModel.updateOne(
      { seasons: seasonId },
      { $inc: { totalEpisodes: 1 } },
    ).exec();

    return this.responseService.responseCreateSuccess('Episode created successfully', savedEpisode);
  }

  async getEpisodes(seasonId: string) {
    if (!Types.ObjectId.isValid(seasonId)) return this.responseService.responseError(`Invalid season ID: ${seasonId}`);
    const season = await this.seasonModel.findById(seasonId).exec();
    if (!season) throw new NotFoundException(`Season with ID ${seasonId} not found`);

    const episodes = await CommonHelpers.retry(() => this.episodeModel.find({ season: seasonId }).exec());
    return this.responseService.responseSuccess(episodes);
  }

  async getEpisode(episodeId: string) {
    if (!Types.ObjectId.isValid(episodeId)) return this.responseService.responseError(`Invalid episode ID: ${episodeId}`);
    const episode = await this.episodeModel.findById(episodeId).exec();
    if (!episode) throw new NotFoundException(`Episode with ID ${episodeId} not found`);
    return this.responseService.responseSuccess(episode);
  }

  async updateEpisode(episodeId: string, updateEpisodeDto: UpdateEpisodeDto) {
    if (!Types.ObjectId.isValid(episodeId)) return this.responseService.responseError(`Invalid episode ID: ${episodeId}`);
    const updateData = {
      ...updateEpisodeDto,
      releaseDate: updateEpisodeDto.releaseDate ? new Date(updateEpisodeDto.releaseDate) : undefined,
    };
    const updatedEpisode = await this.episodeModel.findByIdAndUpdate(episodeId, updateData, { new: true }).exec();
    if (!updatedEpisode) throw new NotFoundException(`Episode with ID ${episodeId} not found`);
    const savedEpisode = await CommonHelpers.retry(() => updatedEpisode.save());
    await CommonHelpers.invalidateCacheByPattern('tv-shows:*');
    return this.responseService.responseUpdateSuccess('Episode updated successfully', savedEpisode);
  }

  async removeEpisode(episodeId: string) {
    if (!Types.ObjectId.isValid(episodeId)) return this.responseService.responseError(`Invalid episode ID: ${episodeId}`);
    const episode = await this.episodeModel.findById(episodeId).exec();
    if (!episode) throw new NotFoundException(`Episode with ID ${episodeId} not found`);

    await this.seasonModel.updateOne(
      { episodes: episodeId },
      { $pull: { episodes: episodeId } },
    ).exec();
    await this.tvShowModel.updateOne(
      { seasons: episode.season },
      { $inc: { totalEpisodes: -1 } },
    ).exec();
    await this.episodeModel.findByIdAndDelete(episodeId).exec();
    return this.responseService.responseDeleteSuccess('Episode deleted successfully', null);
  }

  async addCast(tvShowId: string, cast: { person: string; character: string; order: number }[]) {
    if (!Types.ObjectId.isValid(tvShowId)) return this.responseService.responseError(`Invalid TV show ID: ${tvShowId}`);
    const tvShow = await this.tvShowModel.findById(tvShowId).exec();
    if (!tvShow) throw new NotFoundException(`TV show with ID ${tvShowId} not found`);

    for (const member of cast) {
      if (!Types.ObjectId.isValid(member.person)) throw new BadRequestException(`Invalid person ID: ${member.person}`);
      const person = await this.personService.findOne(member.person);
      if (!person) throw new NotFoundException(`Person with ID ${member.person} not found`);
      tvShow.cast.push({
        person: new Types.ObjectId(member.person),
        character: member.character,
        order: member.order,
      });
    }
    const savedTvShow = await tvShow.save();
    return this.responseService.responseUpdateSuccess('Cast added successfully', savedTvShow);
  }

  async removeCast(tvShowId: string, personId: string) {
    if (!Types.ObjectId.isValid(tvShowId)) return this.responseService.responseError(`Invalid TV show ID: ${tvShowId}`);
    if (!Types.ObjectId.isValid(personId)) return this.responseService.responseError(`Invalid person ID: ${personId}`);
    const tvShow = await this.tvShowModel.findById(tvShowId).exec();
    if (!tvShow) throw new NotFoundException(`TV show with ID ${tvShowId} not found`);

    tvShow.cast = tvShow.cast.filter((castMember) => castMember.person.toString() !== personId);
    const savedTvShow = await tvShow.save();
    return this.responseService.responseUpdateSuccess('Cast removed successfully', savedTvShow);
  }

  async addCrew(tvShowId: string, crew: { person: string; role: string; department: string }[]) {
    if (!Types.ObjectId.isValid(tvShowId)) return this.responseService.responseError(`Invalid TV show ID: ${tvShowId}`);
    const tvShow = await this.tvShowModel.findById(tvShowId).exec();
    if (!tvShow) throw new NotFoundException(`TV show with ID ${tvShowId} not found`);

    for (const member of crew) {
      if (!Types.ObjectId.isValid(member.person)) throw new BadRequestException(`Invalid person ID: ${member.person}`);
      const person = await this.personService.findOne(member.person);
      if (!person) throw new NotFoundException(`Person with ID ${member.person} not found`);
      tvShow.crew.push({
        person: new Types.ObjectId(member.person),
        role: member.role,
        department: member.department,
      });
    }
    const savedTvShow = await tvShow.save();
    return this.responseService.responseUpdateSuccess('Crew added successfully', savedTvShow);
  }

  async removeCrew(tvShowId: string, personId: string) {
    if (!Types.ObjectId.isValid(tvShowId)) return this.responseService.responseError(`Invalid TV show ID: ${tvShowId}`);
    if (!Types.ObjectId.isValid(personId)) return this.responseService.responseError(`Invalid person ID: ${personId}`);
    const tvShow = await this.tvShowModel.findById(tvShowId).exec();
    if (!tvShow) throw new NotFoundException(`TV show with ID ${tvShowId} not found`);

    tvShow.crew = tvShow.crew.filter((crewMember) => crewMember.person.toString() !== personId);
    const savedTvShow = await tvShow.save();
    return this.responseService.responseUpdateSuccess('Crew removed successfully', savedTvShow);
  }

  async incrementPopularity(tvShowId: string, increment: number, options: { session?: ClientSession } = {}): Promise<void> {
    if (!Types.ObjectId.isValid(tvShowId)) {
      throw new BadRequestException(`Invalid TV show ID: ${tvShowId}`);
    }

    const updateOptions: any = {};
    if (options.session) {
      updateOptions.session = options.session;
    }

    const updateOperation = this.tvShowModel.updateOne(
      { _id: new Types.ObjectId(tvShowId) },
      { $inc: { popularity: increment } },
      updateOptions
    );

    try {
      const result = await updateOperation.exec();
      if (result.matchedCount === 0) {
        throw new NotFoundException(`TV show with ID ${tvShowId} not found`);
      }

      // Invalidate relevant caches if not in a transaction
      if (!options.session) {
        await CommonHelpers.invalidateCache([`tv-show:${tvShowId}`]);
        await CommonHelpers.invalidateCacheByPattern('tv-shows:*');
      }
    } catch (error) {
      throw new InternalServerErrorException(`Failed to increment popularity for TV show ${tvShowId}: ${error.message}`);
    }
  }
}