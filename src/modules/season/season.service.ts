import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Season } from './entities/season.entity';
import { CreateSeasonDto, UpdateSeasonDto, QuerySeasonDto, RateSeasonDto } from './dto/create-season.dto';
import { TvShowService } from '../tv-show/tv-show.service';
import { EpisodeService } from '../episode/episode.service';
import { CommonHelpers } from '../../helpers/helpers';
import { ResponseService } from '../../helpers/respon-server/ResponseServer';

@Injectable()
export class SeasonService {
    constructor(
        @InjectModel(Season.name) private seasonModel: Model<Season>,
        private readonly tvShowService: TvShowService,
        @Inject(forwardRef(() => EpisodeService)) private readonly episodeService: EpisodeService,
        private readonly responseService: ResponseService,
    ) { }

    async create(createSeasonDto: CreateSeasonDto) {
        if (!Types.ObjectId.isValid(createSeasonDto.tvShow)) {
            return this.responseService.responseError(`Invalid TV show ID: ${createSeasonDto.tvShow}`);
        }

        const session = await this.seasonModel.db.startSession();
        session.startTransaction();

        try {
            const tvShow = await this.tvShowService.findOne(createSeasonDto.tvShow);
            if (!tvShow) throw new NotFoundException(`TV show with ID ${createSeasonDto.tvShow} not found`);

            const existingSeason = await this.seasonModel.findOne({
                tvShow: createSeasonDto.tvShow,
                seasonNumber: createSeasonDto.seasonNumber,
            }).session(session).exec();
            if (existingSeason) {
                throw new BadRequestException(`Season ${createSeasonDto.seasonNumber} already exists for this TV show`);
            }

            const [season] = await this.seasonModel.create(
                [{
                    ...createSeasonDto,
                    releaseDate: new Date(createSeasonDto.releaseDate),
                    tvShow: new Types.ObjectId(createSeasonDto.tvShow),
                    averageRating: 0,
                    ratingCount: 0,
                    popularity: 0,
                }],
                { session },
            );

            // Add season to TV show
            await this.tvShowService.addSeason(createSeasonDto.tvShow, `${season._id}`, { session });

            // Increment TV show popularity within transaction
            await this.tvShowService.incrementPopularity(createSeasonDto.tvShow, 10, { session });

            await session.commitTransaction();

            await CommonHelpers.invalidateCacheByPattern('seasons:*');
            await CommonHelpers.invalidateCacheByPattern(`tv-show:${createSeasonDto.tvShow}`);
            return this.responseService.responseCreateSuccess('Season created successfully', season);
        } catch (error) {
            await session.abortTransaction();
            return this.responseService.responseError(error.message);
        } finally {
            session.endSession();
        }
    }

    async findAll(queryDto: QuerySeasonDto) {
        const cacheKey = `seasons:all:${JSON.stringify(queryDto)}`;
        const fetchFn = async () => {
            const { page = 1, limit = 10, tvShow, releaseDate, search, sortBy = 'popularity', sortOrder = 'desc' } = queryDto;
            const skip = (page - 1) * limit;
            const query: any = {};

            if (tvShow) {
                if (!Types.ObjectId.isValid(tvShow)) throw new BadRequestException(`Invalid TV show ID: ${tvShow}`);
                query.tvShow = new Types.ObjectId(tvShow);
            }
            if (releaseDate) query.releaseDate = { $gte: new Date(releaseDate) };
            if (search) query.description = { $regex: search, $options: 'i' };

            const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

            const [items, totalCount] = await Promise.all([
                this.seasonModel.find(query).sort(sort).skip(skip).limit(limit).populate('tvShow episodes').exec(),
                this.seasonModel.countDocuments(query).exec(),
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
        if (!Types.ObjectId.isValid(id)) return this.responseService.responseError(`Invalid season ID: ${id}`);
        const cacheKey = `season:${id}`;
        const fetchFn = async () => {
            const season = await this.seasonModel.findById(id).populate('tvShow episodes').exec();
            if (!season) throw new NotFoundException(`Season with ID ${id} not found`);
            return season;
        };

        try {
            const season = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
            return this.responseService.responseSuccess(season);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async update(id: string, updateSeasonDto: UpdateSeasonDto) {
        if (!Types.ObjectId.isValid(id)) return this.responseService.responseError(`Invalid season ID: ${id}`);
        try {
            const updateData = {
                ...updateSeasonDto,
                releaseDate: updateSeasonDto.releaseDate ? new Date(updateSeasonDto.releaseDate) : undefined,
            };
            const updatedSeason = await CommonHelpers.retry(() => this.seasonModel.findByIdAndUpdate(id, updateData, { new: true }).exec());
            if (!updatedSeason) throw new NotFoundException(`Season with ID ${id} not found`);

            await CommonHelpers.invalidateCache([`season:${id}`]);
            await CommonHelpers.invalidateCacheByPattern('seasons:*');
            await CommonHelpers.invalidateCacheByPattern(`tv-show:${updatedSeason.tvShow.toString()}`);
            return this.responseService.responseUpdateSuccess('Season updated successfully', updatedSeason);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async remove(id: string) {
        if (!Types.ObjectId.isValid(id)) return this.responseService.responseError(`Invalid season ID: ${id}`);
        const session = await this.seasonModel.db.startSession();
        session.startTransaction();

        try {
            const season = await this.seasonModel.findById(id).session(session).exec();
            if (!season) throw new NotFoundException(`Season with ID ${id} not found`);

            await this.episodeService.removeEpisodesBySeason(id, { session });
            await this.tvShowService.removeSeason(season.tvShow.toString(), id, { session });
            await this.seasonModel.findByIdAndDelete(id).session(session).exec();

            await session.commitTransaction();

            await CommonHelpers.invalidateCache([`season:${id}`]);
            await CommonHelpers.invalidateCacheByPattern('seasons:*');
            await CommonHelpers.invalidateCacheByPattern(`tv-show:${season.tvShow.toString()}`);
            return this.responseService.responseDeleteSuccess('Season deleted successfully', null);
        } catch (error) {
            await session.abortTransaction();
            return this.responseService.responseError(error.message);
        } finally {
            session.endSession();
        }
    }

    async rateSeason(id: string, rating: number) {
        if (!Types.ObjectId.isValid(id)) return this.responseService.responseError(`Invalid season ID: ${id}`);
        if (rating < 0 || rating > 5) return this.responseService.responseError('Rating must be between 0 and 5');

        try {
            const season = await this.seasonModel.findById(id).exec();
            if (!season) throw new NotFoundException(`Season with ID ${id} not found`);

            season.ratingCount = (season.ratingCount || 0) + 1;
            season.averageRating = ((season.averageRating || 0) * (season.ratingCount - 1) + rating) / season.ratingCount;
            const savedSeason = await CommonHelpers.retry(() => season.save());

            await CommonHelpers.invalidateCache([`season:${id}`]);
            await CommonHelpers.invalidateCacheByPattern('seasons:*');
            return this.responseService.responseUpdateSuccess('Season rated successfully', savedSeason);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async getRecommendations(id: string, limit: number) {
        const cacheKey = `seasons:recommendations:${id}:${limit}`;
        const fetchFn = async () => {
            const season = await this.findOne(id);
            if (!season) throw new NotFoundException(`Season with ID ${id} not found`);

            const tvShowsResponse = await this.tvShowService.getRecommendations(season.tvShow._id.toString(), limit);
        if (tvShowsResponse.statusCode !== 200) throw new Error('Failed to get TV show recommendations');
        const tvShows = tvShowsResponse.data;
            return this.seasonModel.find({ _id: { $ne: id }, tvShow: { $in: tvShows } }).sort({ popularity: -1 }).limit(limit).exec();
        };

        try {
            const recommendations = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
            return this.responseService.responseSuccess(recommendations);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async getTrending(limit: number) {
        const cacheKey = `seasons:trending:${limit}`;
        const fetchFn = () => this.seasonModel.find().sort({ popularity: -1 }).limit(limit).populate('tvShow').exec();

        try {
            const seasons = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn, 3600);
            return this.responseService.responseSuccess(seasons);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async getTvShowId(seasonId: string): Promise<string> {
        if (!Types.ObjectId.isValid(seasonId)) {
            throw new BadRequestException(`Invalid season ID: ${seasonId}`);
        }

        const season = await this.seasonModel.findById(seasonId).select('tvShow').lean().exec();
        if (!season) {
            throw new NotFoundException(`Season with ID ${seasonId} not found`);
        }

        return season.tvShow.toString();
    }

    async getEpisodes(seasonId: string) {
        const cacheKey = `season:${seasonId}:episodes`;
        const fetchFn = async () => {
            if (!Types.ObjectId.isValid(seasonId)) throw new BadRequestException(`Invalid season ID: ${seasonId}`);
            const season = await this.seasonModel.findById(seasonId).populate('episodes').exec();
            if (!season) throw new NotFoundException(`Season with ID ${seasonId} not found`);
            return season.episodes;
        };

        try {
            const episodes = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
            return this.responseService.responseSuccess(episodes);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async incrementPopularity(id: string, increment: number, options?: { session?: ClientSession }): Promise<void> {
        if (!Types.ObjectId.isValid(id)) return this.responseService.responseError(`Invalid TV show ID: ${id}`);
        await this.seasonModel.updateOne(
            { _id: id },
            { $inc: { popularity: increment } },
            { session: options?.session },
        ).exec();
    }

    async removeSeasonsByTvShow(tvShowId: string, options?: { session?: ClientSession }): Promise<void> {
        if (!Types.ObjectId.isValid(tvShowId)) return this.responseService.responseError(`Invalid TV show ID: ${tvShowId}`);

        const seasons: Season[] = await this.seasonModel.find({ tvShow: tvShowId }).session(options?.session ?? null).exec();

        await Promise.all(
            seasons.map(season =>
                this.episodeService.removeEpisodesBySeason(
                    season._id instanceof Types.ObjectId ? season._id.toString() : String(season._id),
                    { session: options?.session }
                )
            )
        );

        await this.seasonModel.deleteMany({ tvShow: tvShowId }).session(options?.session ?? null).exec();
    }

    async addEpisode(seasonId: string, episodeId: string, options?: { session?: ClientSession }): Promise<void> {
        if (!Types.ObjectId.isValid(seasonId)) return this.responseService.responseError(`Invalid season ID: ${seasonId}`);
        if (!Types.ObjectId.isValid(episodeId)) return this.responseService.responseError(`Invalid episode ID: ${episodeId}`);

        const season = await this.seasonModel.findById(seasonId).session(options?.session ?? null).exec();
        if (!season) throw new NotFoundException(`Season with ID ${seasonId} not found`);

        const updateResult = await this.seasonModel.updateOne(
            { _id: seasonId },
            { $addToSet: { episodes: episodeId } },
            { session: options?.session },
        ).exec();

        if (updateResult.modifiedCount === 0) {
            throw new BadRequestException(`Episode ${episodeId} is already in season ${seasonId}`);
        }
    }

    async removeEpisode(seasonId: string, episodeId: string, options?: { session?: ClientSession }): Promise<void> {
        if (!Types.ObjectId.isValid(seasonId)) return this.responseService.responseError(`Invalid season ID: ${seasonId}`);
        if (!Types.ObjectId.isValid(episodeId)) return this.responseService.responseError(`Invalid episode ID: ${episodeId}`);

        const season = await this.seasonModel.findById(seasonId).session(options?.session ?? null).exec();
        if (!season) throw new NotFoundException(`Season with ID ${seasonId} not found`);

        const updateResult = await this.seasonModel.updateOne(
            { _id: seasonId },
            { $pull: { episodes: episodeId } },
            { session: options?.session },
        ).exec();

        if (updateResult.modifiedCount === 0) {
            throw new BadRequestException(`Episode ${episodeId} not found in season ${seasonId}`);
        }
    }
}