import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, forwardRef, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { Episode } from './entities/episode.entity';
import { CreateEpisodeDto, UpdateEpisodeDto, QueryEpisodeDto, RateEpisodeDto, WatchProgressDto } from './dto/create-episode.dto';
import { SeasonService } from '../season/season.service';
import { TvShowService } from '../tv-show/tv-show.service';

@Injectable()
export class EpisodeService {
    constructor(
        @InjectModel(Episode.name) private episodeModel: Model<Episode>,
        @Inject(forwardRef(() => SeasonService)) private readonly seasonService: SeasonService,
        private readonly tvShowService: TvShowService,
    ) { }

    async create(createEpisodeDto: CreateEpisodeDto): Promise<Episode> {
        if (!Types.ObjectId.isValid(createEpisodeDto.season)) {
            throw new BadRequestException(`Invalid season ID: ${createEpisodeDto.season}`);
        }

        const session = await this.episodeModel.db.startSession();
        session.startTransaction();

        try {
            const season = await this.seasonService.findOne(createEpisodeDto.season);
            if (!season) throw new NotFoundException(`Season with ID ${createEpisodeDto.season} not found`);

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

            // Add episode to season
            await this.seasonService.addEpisode(
                createEpisodeDto.season,
                `${episode._id}`,
                { session },
            );

            // Increment season and TV show popularity within transaction
            await this.seasonService.incrementPopularity(createEpisodeDto.season, 5, { session });
            await this.tvShowService.incrementPopularity(season.tvShow._id.toString(), 5, { session });
            // Placeholder for notification
            // await this.notificationService.notifySubscribers(season.tvShow.toString(), episode._id.toString());

            await session.commitTransaction();

            return episode;
        } catch (error) {
            await session.abortTransaction();
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(`Failed to create episode: ${error.message}`);
        } finally {
            session.endSession();
        }
    }


    async findAll(queryDto: QueryEpisodeDto): Promise<{ items: Episode[]; meta: any }> {
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
            this.episodeModel
                .find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('season')
                .exec(),
            this.episodeModel.countDocuments(query).exec(),
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

    async findOne(id: string): Promise<Episode> {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid episode ID: ${id}`);
        const episode = await this.episodeModel.findById(id).populate('season').exec();
        if (!episode) throw new NotFoundException(`Episode with ID ${id} not found`);

        // Increment episode popularity
        episode.popularity = (episode.popularity || 0) + 1;
        await episode.save();

        return episode;
    }

    async update(id: string, updateEpisodeDto: UpdateEpisodeDto, options?: { session?: ClientSession }): Promise<Episode> {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid episode ID: ${id}`);
        const updateData = {
            ...updateEpisodeDto,
            releaseDate: updateEpisodeDto.releaseDate ? new Date(updateEpisodeDto.releaseDate) : undefined,
        };
        const updatedEpisode = await this.episodeModel.findByIdAndUpdate(id, updateData, {
            new: true,
            session: options?.session,
        }).exec();
        if (!updatedEpisode) throw new NotFoundException(`Episode with ID ${id} not found`);
        return updatedEpisode;
    }

    /**
     * Deletes an episode and removes it from the season.
     */
    async remove(id: string): Promise<void> {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid episode ID: ${id}`);
        const episode = await this.episodeModel.findById(id).exec();
        if (!episode) throw new NotFoundException(`Episode with ID ${id} not found`);

        const session = await this.episodeModel.db.startSession();
        session.startTransaction();

        try {
            // Remove episode from season using the new removeEpisode function
            await this.seasonService.removeEpisode(episode.season.toString(), id, { session });

            // Delete episode
            await this.episodeModel.findByIdAndDelete(id).session(session).exec();

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(`Failed to delete episode: ${error.message}`);
        } finally {
            session.endSession();
        }
    }

    async removeEpisodesBySeason(seasonId: string, options?: { session?: ClientSession }): Promise<void> {
        if (!Types.ObjectId.isValid(seasonId)) throw new BadRequestException(`Invalid season ID: ${seasonId}`);
        await this.episodeModel.deleteMany({ season: seasonId }).session(options?.session ?? null).exec();
    }


    /**
     * Rates an episode and updates its average rating.
     */
    async rateEpisode(id: string, rating: number): Promise<Episode> {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid episode ID: ${id}`);
        if (rating < 0 || rating > 5) throw new BadRequestException('Rating must be between 0 and 5');
        const episode = await this.episodeModel.findById(id).exec();
        if (!episode) throw new NotFoundException(`Episode with ID ${id} not found`);

        episode.ratingCount = (episode.ratingCount || 0) + 1;
        episode.averageRating = ((episode.averageRating || 0) * (episode.ratingCount - 1) + rating) / episode.ratingCount;
        return episode.save();
    }

    /**
     * Updates watch progress for an episode (placeholder for user-specific logic).
     */
    async updateWatchProgress(id: string, watchProgressDto: WatchProgressDto): Promise<void> {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid episode ID: ${id}`);
        const episode = await this.episodeModel.findById(id).exec();
        if (!episode) throw new NotFoundException(`Episode with ID ${id} not found`);

        if (watchProgressDto.progress > episode.duration) {
            throw new BadRequestException(`Progress cannot exceed episode duration of ${episode.duration} minutes`);
        }

        // Placeholder: Save user-specific watch progress (requires User model and WatchProgress collection)
        // await this.watchProgressService.update(userId, id, watchProgressDto);
        console.log(`Updated watch progress for episode ${id}: ${watchProgressDto.progress} minutes`);
    }

    /**
     * Retrieves recommended episodes based on TV show genres.
     */
    async getRecommendations(id: string, limit: number): Promise<Episode[]> {
        console.log(`Fetching recommendations for episode ID: ${id}`);
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid episode ID: ${id}`);
        const episode = await this.episodeModel.findById(id).populate('season').exec();
        if (!episode) throw new NotFoundException(`Episode with ID ${id} not found`);

        const similarSeasons = await this.seasonService.getRecommendations(episode.season._id.toString(), limit);

        return this.episodeModel
            .find({
                _id: { $ne: id },
                season: { $in: similarSeasons },
            })
            .sort({ popularity: -1 })
            .limit(limit)
            .exec();
    }

    async getTrending(limit: number): Promise<Episode[]> {
        return this.episodeModel
            .find()
            .sort({ popularity: -1 })
            .limit(limit)
            .populate('season')
            .exec();
    }

    /**
     * Finds episodes by season.
     */
    async findBySeason(seasonId: string): Promise<Episode[]> {
        if (!Types.ObjectId.isValid(seasonId)) throw new BadRequestException(`Invalid season ID: ${seasonId}`);
        return this.episodeModel.find({ season: seasonId }).exec();
    }

    async incrementPopularity(id: string, increment: number, options?: { session?: ClientSession }): Promise<void> {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid episode ID: ${id}`);
        await this.episodeModel.updateOne(
            { _id: id },
            { $inc: { popularity: increment } },
            { session: options?.session },
        ).exec();
    }
}