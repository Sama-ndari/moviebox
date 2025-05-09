import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { TvShow } from './entities/tv-show.entity';
import { Season } from '../season/entities/season.entity';
import { Episode } from '../episode/entities/episode.entity';
import { PersonService } from '../person/person.service';
import { UpdateEpisodeDto } from 'src/episode/dto/create-episode.dto';
import { UpdateSeasonDto } from 'src/season/dto/create-season.dto';
import { CreateTvShowDto, QueryTvShowDto, UpdateTvShowDto } from './dto/create-tv-show.dto';
import { SeasonService } from 'src/season/season.service';

@Injectable()
export class TvShowService {
  constructor(
    @InjectModel(TvShow.name) private tvShowModel: Model<TvShow>,
    @InjectModel(Season.name) private seasonModel: Model<Season>,
    @InjectModel(Episode.name) private episodeModel: Model<Episode>,
    // @Inject(forwardRef(() => SeasonService)) private readonly seasonService: SeasonService,
    private readonly personService: PersonService,
  ) { }

  async create(createTvShowDto: CreateTvShowDto): Promise<TvShow> {
    const createdTvShow = new this.tvShowModel({
      ...createTvShowDto,
      releaseDate: new Date(createTvShowDto.releaseDate),
      endDate: createTvShowDto.endDate ? new Date(createTvShowDto.endDate) : undefined,
    });
    return createdTvShow.save();
  }

  async findAll(queryDto: QueryTvShowDto): Promise<{ items: TvShow[]; meta: any }> {
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

    return {
      items,
      meta: {
        totalItems: totalCount,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      },
    };
  }

  async findOne(id: string): Promise<TvShow> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid TV show ID: ${id}`);
    const tvShow = await this.tvShowModel.findById(id).populate('seasons cast.person crew.person').exec();
    if (!tvShow) throw new NotFoundException(`TV show with ID ${id} not found`);
    return tvShow;
  }

  async update(id: string, updateTvShowDto: UpdateTvShowDto, options?: { session?: ClientSession }): Promise<TvShow> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid TV show ID: ${id}`);
    const updateData = {
      ...updateTvShowDto,
      releaseDate: updateTvShowDto.releaseDate ? new Date(updateTvShowDto.releaseDate) : undefined,
      endDate: updateTvShowDto.endDate ? new Date(updateTvShowDto.endDate) : undefined,
    };
    const updatedTvShow = await this.tvShowModel.findByIdAndUpdate(id, updateData, {
      new: true,
      session: options?.session,
    }).exec();
    if (!updatedTvShow) throw new NotFoundException(`TV show with ID ${id} not found`);
    return updatedTvShow;
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid TV show ID: ${id}`);

    // Start a session for the transaction
    const session = await this.tvShowModel.db.startSession();
    session.startTransaction();

    try {
      // First check if the TV show exists without populating
      const tvShow = await this.tvShowModel.findById(id).session(session).exec();
      if (!tvShow) throw new NotFoundException(`TV show with ID ${id} not found`);

      // Find all seasons directly using the tvShow as a reference
      const seasons = await this.seasonModel.find({ tvShow: id }).session(session).exec();
      console.log('Seasons to delete:', seasons);

      // Delete episodes for each season
      for (const season of seasons) {
        const seasonId = season._id instanceof Types.ObjectId ? season._id.toString() : String(season._id);
        await this.episodeModel.deleteMany({ season: seasonId }).session(session).exec();
      }

      // Delete all seasons
      await this.seasonModel.deleteMany({ tvShow: id }).session(session).exec();

      // Delete the TV show
      await this.tvShowModel.findByIdAndDelete(id).session(session).exec();

      // Commit the transaction
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw new InternalServerErrorException(`Failed to delete TV show: ${error.message}`);
    } finally {
      session.endSession();
    }
  }

  async rateTvShow(id: string, rating: number): Promise<TvShow> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid TV show ID: ${id}`);
    if (rating < 0 || rating > 5) throw new BadRequestException('Rating must be between 0 and 5');
    const tvShow = await this.tvShowModel.findById(id).exec();
    if (!tvShow) throw new NotFoundException(`TV show with ID ${id} not found`);

    tvShow.ratingCount = (tvShow.ratingCount || 0) + 1;
    tvShow.averageRating = ((tvShow.averageRating || 0) * (tvShow.ratingCount - 1) + rating) / tvShow.ratingCount;
    return tvShow.save();
  }

  async getRecommendations(id: string, limit: number): Promise<TvShow[]> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid TV show ID: ${id}`);
    const tvShow = await this.tvShowModel.findById(id).exec();
    if (!tvShow) throw new NotFoundException(`TV show with ID ${id} not found`);

    return this.tvShowModel
      .find({ _id: { $ne: id }, genres: { $in: tvShow.genres } })
      .sort({ popularity: -1 })
      .limit(limit)
      .exec();
  }

  async getTrending(limit: number): Promise<TvShow[]> {
    return this.tvShowModel
      .find({ isActive: true })
      .sort({ popularity: -1 })
      .limit(limit)
      .exec();
  }

  async incrementPopularity(id: string, increment: number, options?: { session?: any }): Promise<void> {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid TV show ID: ${id}`);
    await this.tvShowModel.updateOne(
      { _id: id },
      { $inc: { popularity: increment } },
      options?.session ? { session: options.session } : undefined,
    ).exec();
  }


  async addSeason(tvShowId: string, seasonId: string, options?: { session?: ClientSession }): Promise<void> {
    if (!Types.ObjectId.isValid(tvShowId)) throw new BadRequestException(`Invalid TV show ID: ${tvShowId}`);
    if (!Types.ObjectId.isValid(seasonId)) throw new BadRequestException(`Invalid season ID: ${seasonId}`);

    const tvShow = await this.tvShowModel.findById(tvShowId).session(options?.session ?? null).exec();
    if (!tvShow) throw new NotFoundException(`TV show with ID ${tvShowId} not found`);

    const updateResult = await this.tvShowModel.updateOne(
      { _id: tvShowId },
      { $addToSet: { seasons: seasonId } },
      { session: options?.session },
    ).exec();

    if (updateResult.modifiedCount === 0) {
      throw new BadRequestException(`Season ${seasonId} is already in TV show ${tvShowId}`);
    }

    // return this.tvShowModel.findById(tvShowId).session(options?.session ?? null).exec();
  }


  async getSeasons(tvShowId: string): Promise<any> {
    if (!Types.ObjectId.isValid(tvShowId)) throw new BadRequestException(`Invalid TV show ID: ${tvShowId}`);
    const tvShow = await this.tvShowModel.findById(tvShowId).populate('seasons cast.person crew.person').exec();
    if (!tvShow) throw new NotFoundException(`TV show with ID ${tvShowId} not found`);


    return tvShow.seasons;
  }

  async getSeason(seasonId: string): Promise<Season> {
    if (!Types.ObjectId.isValid(seasonId)) throw new BadRequestException(`Invalid season ID: ${seasonId}`);
    const season = await this.seasonModel.findById(seasonId).populate('episodes').exec();
    if (!season) throw new NotFoundException(`Season with ID ${seasonId} not found`);
    return season;
  }

  async updateSeason(seasonId: string, updateSeasonDto: UpdateSeasonDto): Promise<Season> {
    if (!Types.ObjectId.isValid(seasonId)) throw new BadRequestException(`Invalid season ID: ${seasonId}`);
    const updateData = {
      ...updateSeasonDto,
      releaseDate: updateSeasonDto.releaseDate ? new Date(updateSeasonDto.releaseDate) : undefined,
    };
    const updatedSeason = await this.seasonModel.findByIdAndUpdate(seasonId, updateData, { new: true }).exec();
    if (!updatedSeason) throw new NotFoundException(`Season with ID ${seasonId} not found`);
    return updatedSeason;
  }

  async removeSeason(tvShowId: string, seasonId: string, options?: { session?: ClientSession }): Promise<void> {
    if (!Types.ObjectId.isValid(tvShowId)) throw new BadRequestException(`Invalid TV show ID: ${tvShowId}`);
    if (!Types.ObjectId.isValid(seasonId)) throw new BadRequestException(`Invalid season ID: ${seasonId}`);

    const tvShow = await this.tvShowModel.findById(tvShowId).session(options?.session ?? null).exec();
    if (!tvShow) throw new NotFoundException(`TV show with ID ${tvShowId} not found`);

    const updateResult = await this.tvShowModel.updateOne(
      { _id: tvShowId },
      { $pull: { seasons: seasonId } },
      { session: options?.session },
    ).exec();

    if (updateResult.modifiedCount === 0) {
      throw new BadRequestException(`Season ${seasonId} not found in TV show ${tvShowId}`);
    }

    await this.episodeModel.deleteMany({ season: seasonId }).session(options?.session ?? null).exec();
    await this.seasonModel.findByIdAndDelete(seasonId).session(options?.session ?? null).exec();
  }

  /**
   * Adds an episode to a season.
   */
  //   async addEpisode(seasonId: string, createEpisodeDto: CreateEpisodeDto): Promise<Episode> {
  //     if (!Types.ObjectId.isValid(seasonId)) throw new BadRequestException(`Invalid season ID: ${seasonId}`);
  //     const season = await this.seasonModel.findById(seasonId).exec();
  //     if (!season) throw new NotFoundException(`Season with ID ${seasonId} not found`);

  //     const episode = new this.episodeModel({
  //       ...createEpisodeDto,
  //       releaseDate: new Date(createEpisodeDto.releaseDate),
  //       season: seasonId,
  //     });
  //     const savedEpisode = await episode.save();

  //     season.episodes.push(savedEpisode._id);
  //     await season.save();

  //     await this.tvShowModel.updateOne(
  //       { seasons: seasonId },
  //       { $inc: { totalEpisodes: 1 } },
  //     ).exec();

  //     return savedEpisode;
  //   }

  /**
   * Retrieves all episodes of a season.
   */
  async getEpisodes(seasonId: string): Promise<Episode[]> {
    if (!Types.ObjectId.isValid(seasonId)) throw new BadRequestException(`Invalid season ID: ${seasonId}`);
    const season = await this.seasonModel.findById(seasonId).exec();
    if (!season) throw new NotFoundException(`Season with ID ${seasonId} not found`);

    return this.episodeModel.find({ season: seasonId }).exec();
  }

  /**
   * Retrieves a specific episode.
   */
  async getEpisode(episodeId: string): Promise<Episode> {
    if (!Types.ObjectId.isValid(episodeId)) throw new BadRequestException(`Invalid episode ID: ${episodeId}`);
    const episode = await this.episodeModel.findById(episodeId).exec();
    if (!episode) throw new NotFoundException(`Episode with ID ${episodeId} not found`);
    return episode;
  }

  /**
   * Updates an episode.
   */
  async updateEpisode(episodeId: string, updateEpisodeDto: UpdateEpisodeDto): Promise<Episode> {
    if (!Types.ObjectId.isValid(episodeId)) throw new BadRequestException(`Invalid episode ID: ${episodeId}`);
    const updateData = {
      ...updateEpisodeDto,
      releaseDate: updateEpisodeDto.releaseDate ? new Date(updateEpisodeDto.releaseDate) : undefined,
    };
    const updatedEpisode = await this.episodeModel.findByIdAndUpdate(episodeId, updateData, { new: true }).exec();
    if (!updatedEpisode) throw new NotFoundException(`Episode with ID ${episodeId} not found`);
    return updatedEpisode;
  }

  async removeEpisode(episodeId: string): Promise<void> {
    if (!Types.ObjectId.isValid(episodeId)) throw new BadRequestException(`Invalid episode ID: ${episodeId}`);
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
  }

  async addCast(tvShowId: string, cast: { person: string; character: string; order: number }[]): Promise<TvShow> {
    if (!Types.ObjectId.isValid(tvShowId)) throw new BadRequestException(`Invalid TV show ID: ${tvShowId}`);
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
    return tvShow.save();
  }

  async removeCast(tvShowId: string, personId: string): Promise<TvShow> {
    if (!Types.ObjectId.isValid(tvShowId)) throw new BadRequestException(`Invalid TV show ID: ${tvShowId}`);
    if (!Types.ObjectId.isValid(personId)) throw new BadRequestException(`Invalid person ID: ${personId}`);
    const tvShow = await this.tvShowModel.findById(tvShowId).exec();
    if (!tvShow) throw new NotFoundException(`TV show with ID ${tvShowId} not found`);

    tvShow.cast = tvShow.cast.filter((castMember) => castMember.person.toString() !== personId);
    return tvShow.save();
  }

  async addCrew(tvShowId: string, crew: { person: string; role: string; department: string }[]): Promise<TvShow> {
    if (!Types.ObjectId.isValid(tvShowId)) throw new BadRequestException(`Invalid TV show ID: ${tvShowId}`);
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
    return tvShow.save();
  }

  async removeCrew(tvShowId: string, personId: string): Promise<TvShow> {
    if (!Types.ObjectId.isValid(tvShowId)) throw new BadRequestException(`Invalid TV show ID: ${tvShowId}`);
    if (!Types.ObjectId.isValid(personId)) throw new BadRequestException(`Invalid person ID: ${personId}`);
    const tvShow = await this.tvShowModel.findById(tvShowId).exec();
    if (!tvShow) throw new NotFoundException(`TV show with ID ${tvShowId} not found`);

    tvShow.crew = tvShow.crew.filter((crewMember) => crewMember.person.toString() !== personId);
    return tvShow.save();
  }
}