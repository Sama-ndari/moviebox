import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import { Season } from './entities/season.entity';
import { CreateSeasonDto, UpdateSeasonDto, QuerySeasonDto, RateSeasonDto } from './dto/create-season.dto';
import { TvShowService } from '../tv-show/tv-show.service';
import { EpisodeService } from '../episode/episode.service';

@Injectable()
export class SeasonService {
    constructor(
        @InjectModel(Season.name) private seasonModel: Model<Season>,
        private readonly tvShowService: TvShowService,
        @Inject(forwardRef(() => EpisodeService)) private readonly episodeService: EpisodeService,
    ) { }

    async create(createSeasonDto: CreateSeasonDto): Promise<Season> {
        if (!Types.ObjectId.isValid(createSeasonDto.tvShow)) {
            throw new BadRequestException(`Invalid TV show ID: ${createSeasonDto.tvShow}`);
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

            return season;
        } catch (error) {
            await session.abortTransaction();
            if (error instanceof BadRequestException || error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(`Failed to create season: ${error.message}`);
        } finally {
            session.endSession();
        }
    }

    async findAll(queryDto: QuerySeasonDto): Promise<{ items: Season[]; meta: any }> {
        const { page = 1, limit = 10, tvShow, releaseDate, search, sortBy = 'popularity', sortOrder = 'desc' } = queryDto;
        const skip = (page - 1) * limit;
        const query: any = {};

        if (tvShow) {
            if (!Types.ObjectId.isValid(tvShow)) throw new BadRequestException(`Invalid TV show ID: ${tvShow}`);
            query.tvShow = new Types.ObjectId(tvShow);
        }
        if (releaseDate) query.releaseDate = { $gte: new Date(releaseDate) };
        if (search) query.description = { $regex: search, $options: 'i' }; // Note: Add text index for better search

        const sort: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

        const [items, totalCount] = await Promise.all([
            this.seasonModel
                .find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .populate('tvShow episodes')
                .exec(),
            this.seasonModel.countDocuments(query).exec(),
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

    async findOne(id: string): Promise<Season> {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid season ID: ${id}`);
        const season = await this.seasonModel.findById(id).populate('tvShow episodes').exec();
        if (!season) throw new NotFoundException(`Season with ID ${id} not found`);
        return season;
    }

    async update(id: string, updateSeasonDto: UpdateSeasonDto, options?: { session?: ClientSession }): Promise<Season> {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid season ID: ${id}`);
        const updateData = {
            ...updateSeasonDto,
            releaseDate: updateSeasonDto.releaseDate ? new Date(updateSeasonDto.releaseDate) : undefined,
        };
        const updatedSeason = await this.seasonModel.findByIdAndUpdate(id, updateData, {
            new: true,
            session: options?.session,
        }).exec();
        if (!updatedSeason) throw new NotFoundException(`Season with ID ${id} not found`);
        return updatedSeason;
    }

    async remove(id: string): Promise<void> {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid season ID: ${id}`);
        const season = await this.seasonModel.findById(id).exec();
        if (!season) throw new NotFoundException(`Season with ID ${id} not found`);

        const session = await this.seasonModel.db.startSession();
        session.startTransaction();

        try {
            await this.episodeService.removeEpisodesBySeason(id, { session });
            await this.tvShowService.removeSeason(season.tvShow.toString(), id, { session });
            await this.seasonModel.findByIdAndDelete(id).session(session).exec();
            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw new InternalServerErrorException(`Failed to delete season: ${error.message}`);
        } finally {
            session.endSession();
        }
    }

    async removeSeasonsByTvShow(tvShowId: string, options?: { session?: ClientSession }): Promise<void> {
        if (!Types.ObjectId.isValid(tvShowId)) throw new BadRequestException(`Invalid TV show ID: ${tvShowId}`);

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
        if (!Types.ObjectId.isValid(seasonId)) throw new BadRequestException(`Invalid season ID: ${seasonId}`);
        if (!Types.ObjectId.isValid(episodeId)) throw new BadRequestException(`Invalid episode ID: ${episodeId}`);

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
        if (!Types.ObjectId.isValid(seasonId)) throw new BadRequestException(`Invalid season ID: ${seasonId}`);
        if (!Types.ObjectId.isValid(episodeId)) throw new BadRequestException(`Invalid episode ID: ${episodeId}`);

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

    async rateSeason(id: string, rating: number): Promise<Season> {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid season ID: ${id}`);
        if (rating < 0 || rating > 5) throw new BadRequestException('Rating must be between 0 and 5');
        const season = await this.seasonModel.findById(id).exec();
        if (!season) throw new NotFoundException(`Season with ID ${id} not found`);

        season.ratingCount = (season.ratingCount || 0) + 1;
        season.averageRating = ((season.averageRating || 0) * (season.ratingCount - 1) + rating) / season.ratingCount;
        return season.save();
    }

    async getRecommendations(id: string, limit: number): Promise<Season[]> {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid season ID: ${id}`);
        const season = await this.seasonModel.findById(id).exec();
        if (!season) throw new NotFoundException(`Season with ID ${id} not found`);

        const tvShows = await this.tvShowService.getRecommendations(season.tvShow.toString(), limit);
        return this.seasonModel
            .find({
                _id: { $ne: id },
                tvShow: { $in: tvShows },
            })
            .sort({ popularity: -1 })
            .limit(limit)
            .exec();
    }

    async getTrending(limit: number): Promise<Season[]> {
        return this.seasonModel
            .find()
            .sort({ popularity: -1 })
            .limit(limit)
            .populate('tvShow')
            .exec();
    }


    async getEpisodes(seasonId: string): Promise<any[]> {
        if (!Types.ObjectId.isValid(seasonId)) throw new BadRequestException(`Invalid season ID: ${seasonId}`);
        const season = await this.seasonModel.findById(seasonId).exec();
        if (!season) throw new NotFoundException(`Season with ID ${seasonId} not found`);

        return season.episodes;
    }

    async incrementPopularity(id: string, increment: number, options?: { session?: ClientSession }): Promise<void> {
        if (!Types.ObjectId.isValid(id)) throw new BadRequestException(`Invalid TV show ID: ${id}`);
        await this.seasonModel.updateOne(
            { _id: id },
            { $inc: { popularity: increment } },
            { session: options?.session },
        ).exec();
    }
}