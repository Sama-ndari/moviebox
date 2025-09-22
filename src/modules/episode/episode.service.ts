import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { Episode } from './entities/episode.entity';
import { CreateEpisodeDto, UpdateEpisodeDto, QueryEpisodeDto, RateEpisodeDto, WatchProgressDto } from './dto/create-episode.dto';
import { SeasonService } from '../season/season.service';
import { TvShowService } from '../tv-show/tv-show.service';
import { CommonHelpers } from '../../helpers/helpers';
import { ResponseService } from '../../helpers/respon-server/ResponseServer';

@Injectable()
export class EpisodeService {
    constructor(
        @InjectModel(Episode.name) private episodeModel: Model<Episode>,
        @Inject(forwardRef(() => SeasonService)) private readonly seasonService: SeasonService,
        private readonly tvShowService: TvShowService,
        private readonly responseService: ResponseService,
    ) { }

    async create(createEpisodeDto: CreateEpisodeDto) {
        if (!Types.ObjectId.isValid(createEpisodeDto.season)) {
            return this.responseService.responseError(`Invalid season ID: ${createEpisodeDto.season}`);
        }

        const session = await this.episodeModel.db.startSession();
        session.startTransaction();

        try {
            const seasonResponse = await this.seasonService.findOne(createEpisodeDto.season);
            if (seasonResponse.statusCode !== 200) {
                throw new NotFoundException(`Season with ID ${createEpisodeDto.season} not found`);
            }
            const season = seasonResponse.data;

            const existingEpisode = await this.episodeModel.findOne({
                season: createEpisodeDto.season,
                episodeNumber: createEpisodeDto.episodeNumber,
            }).session(session).exec();
            if (existingEpisode) {
                throw new BadRequestException(
                    `Episode ${createEpisodeDto.episodeNumber} already exists for season ${createEpisodeDto.season}`,
                );
            }

            const [episode] = await this.episodeModel.create(
                [{
                    ...createEpisodeDto,
                    releaseDate: new Date(createEpisodeDto.releaseDate),
                    season: createEpisodeDto.season,
                    averageRating: 0,
                    ratingCount: 0,
                    popularity: 0,
                }],
                { session },
            );

            await this.seasonService.addEpisode(createEpisodeDto.season, `${episode._id}`, { session });
            await this.tvShowService.incrementPopularity(season.tvShow._id.toString(), 5, { session });

            await session.commitTransaction();

            await CommonHelpers.invalidateCacheByPattern('episodes:*');
            await CommonHelpers.invalidateCacheByPattern(`season:${createEpisodeDto.season}`);
            return this.responseService.responseCreateSuccess('Episode created successfully', episode);
        } catch (error) {
            await session.abortTransaction();
            return this.responseService.responseError(error.message);
        } finally {
            session.endSession();
        }
    }

    async findAll(queryDto: QueryEpisodeDto) {
        const cacheKey = `episodes:all:${JSON.stringify(queryDto)}`;
        const fetchFn = async () => {
            const { page = 1, limit = 10, season, releaseDate, search, sortBy = 'popularity', sortOrder = 'desc' } = queryDto;
            const skip = (page - 1) * limit;
            const query: any = {};

            if (season) {
                if (!Types.ObjectId.isValid(season)) throw new BadRequestException(`Invalid season ID: ${season}`);
                query.season = new Types.ObjectId(season);
            }
            if (releaseDate) query.releaseDate = { $gte: new Date(releaseDate) };
            if (search) query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];

            const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

            const [items, totalCount] = await Promise.all([
                this.episodeModel.find(query).sort(sort).skip(skip).limit(limit).populate('season').exec(),
                this.episodeModel.countDocuments(query).exec(),
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
        if (!Types.ObjectId.isValid(id)) return this.responseService.responseError(`Invalid episode ID: ${id}`);
        const cacheKey = `episode:${id}`;
        const fetchFn = async () => {
            const episode = await this.episodeModel.findById(id).populate('season').exec();
            if (!episode) throw new NotFoundException(`Episode with ID ${id} not found`);
            return episode;
        };

        try {
            const episode = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
            return this.responseService.responseSuccess(episode);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async update(id: string, updateEpisodeDto: UpdateEpisodeDto) {
        if (!Types.ObjectId.isValid(id)) return this.responseService.responseError(`Invalid episode ID: ${id}`);
        try {
            const updateData = {
                ...updateEpisodeDto,
                releaseDate: updateEpisodeDto.releaseDate ? new Date(updateEpisodeDto.releaseDate) : undefined,
            };
            const updatedEpisode = await CommonHelpers.retry(() => this.episodeModel.findByIdAndUpdate(id, updateData, { new: true }).exec());
            if (!updatedEpisode) throw new NotFoundException(`Episode with ID ${id} not found`);

            await CommonHelpers.invalidateCache([`episode:${id}`]);
            await CommonHelpers.invalidateCacheByPattern('episodes:*');
            await CommonHelpers.invalidateCacheByPattern(`season:${updatedEpisode.season.toString()}`);
            return this.responseService.responseUpdateSuccess('Episode updated successfully', updatedEpisode);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async remove(id: string) {
        if (!Types.ObjectId.isValid(id)) return this.responseService.responseError(`Invalid episode ID: ${id}`);
        const session = await this.episodeModel.db.startSession();
        session.startTransaction();

        try {
            const episode = await this.episodeModel.findById(id).session(session).exec();
            if (!episode) throw new NotFoundException(`Episode with ID ${id} not found`);

            await this.seasonService.removeEpisode(episode.season.toString(), id, { session });
            await this.episodeModel.findByIdAndDelete(id).session(session).exec();

            await session.commitTransaction();

            await CommonHelpers.invalidateCache([`episode:${id}`]);
            await CommonHelpers.invalidateCacheByPattern('episodes:*');
            await CommonHelpers.invalidateCacheByPattern(`season:${episode.season.toString()}`);
            return this.responseService.responseDeleteSuccess('Episode deleted successfully', null);
        } catch (error) {
            await session.abortTransaction();
            return this.responseService.responseError(error.message);
        } finally {
            session.endSession();
        }
    }

    async rateEpisode(id: string, rating: number) {
        if (!Types.ObjectId.isValid(id)) return this.responseService.responseError(`Invalid episode ID: ${id}`);
        if (rating < 0 || rating > 5) return this.responseService.responseError('Rating must be between 0 and 5');

        try {
            const episode = await this.episodeModel.findById(id).exec();
            if (!episode) throw new NotFoundException(`Episode with ID ${id} not found`);

            episode.ratingCount = (episode.ratingCount || 0) + 1;
            episode.averageRating = ((episode.averageRating || 0) * (episode.ratingCount - 1) + rating) / episode.ratingCount;
            const savedEpisode = await CommonHelpers.retry(() => episode.save());

            await CommonHelpers.invalidateCache([`episode:${id}`]);
            await CommonHelpers.invalidateCacheByPattern('episodes:*');
            return this.responseService.responseUpdateSuccess('Episode rated successfully', savedEpisode);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async getRecommendations(id: string, limit: number) {
        const cacheKey = `episodes:recommendations:${id}:${limit}`;
        const fetchFn = async () => {
            const episode = await this.findOne(id);
            if (!episode) throw new NotFoundException(`Episode with ID ${id} not found`);

            const similarSeasons = await this.seasonService.getRecommendations(episode.season._id.toString(), limit);
            return this.episodeModel.find({ _id: { $ne: id }, season: { $in: similarSeasons } }).sort({ popularity: -1 }).limit(limit).exec();
        };

        try {
            const recommendations = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
            return this.responseService.responseSuccess(recommendations);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async getTrending(limit: number) {
        const cacheKey = `episodes:trending:${limit}`;
        const fetchFn = () => this.episodeModel.find().sort({ popularity: -1 }).limit(limit).populate('season').exec();

        try {
            const episodes = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn, 3600);
            return this.responseService.responseSuccess(episodes);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async updateWatchProgress(id: string, watchProgressDto: WatchProgressDto) {
        if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(`Invalid episode ID: ${id}`);
        }

        const session = await this.episodeModel.db.startSession();
        session.startTransaction();

        try {
            const episode = await this.episodeModel.findById(id).session(session);
            if (!episode) {
                throw new NotFoundException(`Episode with ID ${id} not found`);
            }

            // Update watch progress
            episode.watchProgress = {
                progress: watchProgressDto.progress,
                completed: watchProgressDto.completed || false,
                lastWatchedAt: new Date()
            };

            // If completed, increment watch count
            if (watchProgressDto.completed) {
                episode.watchCount = (episode.watchCount || 0) + 1;
                // Increment popularity when an episode is completed
                episode.popularity = (episode.popularity || 0) + 1;
                
                // Also update the season and TV show popularity
                await this.seasonService.incrementPopularity(episode.season.toString(), 1, { session });
                await this.tvShowService.incrementPopularity(
                    (await this.seasonService.getTvShowId(episode.season.toString())),
                    1,
                    { session }
                );
            }

            const updatedEpisode = await episode.save({ session });
            await session.commitTransaction();

            // Invalidate relevant caches
            await CommonHelpers.invalidateCache([`episode:${id}`]);
            await CommonHelpers.invalidateCacheByPattern('episodes:*');
            
            return this.responseService.responseUpdateSuccess('Watch progress updated successfully', updatedEpisode);
        } catch (error) {
            await session.abortTransaction();
            throw new InternalServerErrorException(`Failed to update watch progress: ${error.message}`);
        } finally {
            await session.endSession();
        }
    }

    async removeEpisodesBySeason(seasonId: string, options: { session?: ClientSession } = {}) {
        if (!Types.ObjectId.isValid(seasonId)) {
            throw new BadRequestException(`Invalid season ID: ${seasonId}`);
        }

        try {
            const result = await this.episodeModel
                .deleteMany({ season: new Types.ObjectId(seasonId) })
                .session(options.session || null)
                .exec();

            // Invalidate relevant caches
            await CommonHelpers.invalidateCacheByPattern('episodes:*');
            await CommonHelpers.invalidateCacheByPattern(`season:*`);

            return result;
        } catch (error) {
            throw new InternalServerErrorException(`Failed to remove episodes for season ${seasonId}: ${error.message}`);
        }
    }
}