// src/watchlist/watchlist.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { WatchlistItem } from './entities/watchlist.entity';
import { AddToWatchlistDto, UpdateWatchlistDto, RemoveFromWatchlistDto, ShareWatchlistDto } from './dto/addToWatchlist.dto';
import { MoviesService } from '../movie/movie.service';
import { TvShowService } from '../tv-show/tv-show.service';
import { SeasonService } from '../season/season.service';
import { EpisodeService } from '../episode/episode.service';
import { UserService } from '../user/user.service';
import { NotificationService } from '../notification/notification.service';
import { v4 as uuidv4 } from 'uuid';
import { CommonHelpers } from '../../helpers/helpers';
import { NotificationType } from '../notification/entities/notification.entity';
import { ResponseService } from '../../helpers/respon-server/ResponseServer';

@Injectable()
export class WatchlistService {
  constructor(
    @InjectModel(WatchlistItem.name) private watchlistModel: Model<WatchlistItem>,
    private readonly moviesService: MoviesService,
    private readonly tvshowService: TvShowService,
    private readonly seasonService: SeasonService,
    private readonly episodeService: EpisodeService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly responseService: ResponseService,
  ) {}

  async addToWatchlist(userId: string, dto: AddToWatchlistDto) {
    try {
      const { contentId, contentType, note, priority, tags } = dto;

      const user = await this.userService.findOne(userId);
      if (!user) throw new NotFoundException('User not found');

      await this.validateContent(contentId, contentType);

      const existingItem = await CommonHelpers.retry(() => this.watchlistModel.findOne({ user: userId, content: contentId, contentType }).exec());
      if (existingItem) throw new BadRequestException('Content already in watchlist');

      const newItem = new this.watchlistModel({
        user: userId,
        content: contentId,
        contentType,
        note,
        priority,
        tags,
        watchProgress: 0,
        watchPartyEnabled: false,
      });

      const savedItem = await CommonHelpers.retry(() => newItem.save());

      if (priority === 'High') {
        await this.notificationService.notifyUser({ userId, message: `High-priority item "${contentId}" added to your watchlist!`, type: NotificationType.GENERAL });
      }

      await CommonHelpers.invalidateCache([`watchlist:${userId}`]);
      return this.responseService.responseCreateSuccess('Content added to watchlist', savedItem);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async removeFromWatchlist(userId: string, dto: RemoveFromWatchlistDto) {
    try {
      const { contentId, contentType } = dto;

      const user = await this.userService.findOne(userId);
      if (!user) throw new NotFoundException('User not found');

      const result = await CommonHelpers.retry(() => this.watchlistModel.deleteOne({ user: userId, content: contentId, contentType }).exec());
      if (result.deletedCount === 0) throw new NotFoundException('Item not found in watchlist');

      await CommonHelpers.invalidateCache([`watchlist:${userId}`]);
      return this.responseService.responseDeleteSuccess('Content removed from watchlist', null);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async getWatchlist(userId: string) {
    const cacheKey = `watchlist:${userId}`;
    const fetchFn = async () => {
      const user = await this.userService.findOne(userId);
      if (!user) throw new NotFoundException('User not found');

      return this.watchlistModel.find({ user: userId }).populate('content').sort({ addedAt: -1 }).exec();
    };

    try {
      const watchlist = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
      return this.responseService.responseSuccess(watchlist);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async updateWatchlist(userId: string, watchlistItemId: string, dto: UpdateWatchlistDto) {
    try {
      const item = await CommonHelpers.retry(() => this.watchlistModel.findOne({ _id: watchlistItemId, user: userId }).exec());
      if (!item) throw new NotFoundException('Watchlist item not found');

      Object.assign(item, {
        note: dto.note,
        priority: dto.priority,
        tags: dto.tags,
        watchProgress: dto.watchProgress,
        watchPartyDate: dto.watchPartyDate ? new Date(dto.watchPartyDate) : item.watchPartyDate,
        watchPartyParticipants: dto.watchPartyParticipants || item.watchPartyParticipants,
        watchPartyEnabled: (dto.watchPartyParticipants?.length ?? 0) > 0 || !!dto.watchPartyDate,
      });

      const updatedItem = await CommonHelpers.retry(() => item.save());

      if (dto.watchPartyParticipants?.length) {
        await this.notificationService.notifyUsers({
          userIds: dto.watchPartyParticipants,
          message: `You've been invited to a watch party for "${item.content}" on ${item.watchPartyDate}!`,
        });
      }

      await CommonHelpers.invalidateCache([`watchlist:${userId}`]);
      return this.responseService.responseUpdateSuccess('Watchlist item updated', updatedItem);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async shareWatchlist(userId: string, dto: ShareWatchlistDto) {
    try {
      const item = await CommonHelpers.retry(() => this.watchlistModel.findOne({ _id: dto.watchlistItemId, user: userId }).exec());
      if (!item) throw new NotFoundException('Watchlist item not found');

      if (!item.shareLink) {
        item.shareLink = uuidv4();
        await CommonHelpers.retry(() => item.save());
      }

      await CommonHelpers.invalidateCache([`watchlist:${userId}`]);
      const shareLink = `${process.env.APP_URL}/watchlist/share/${item.shareLink}`;
      return this.responseService.responseSuccess({ shareLink });
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async getRecommendations(userId: string) {
    const cacheKey = `recommendations:watchlist:${userId}`;
    const fetchFn = async () => {
      const watchlistResponse = await this.getWatchlist(userId);
      if (watchlistResponse.statusCode !== 200 || watchlistResponse.data.length === 0) return [];
      const watchlist = watchlistResponse.data;

      const contentIds = watchlist.map(item => (item.content as any)._id.toString());
      const contentTypes = watchlist.map(item => item.contentType);

      const recommendations: any[] = [];
      for (let i = 0; i < contentIds.length; i++) {
        const contentId = contentIds[i];
        const contentType = contentTypes[i];
        let recs;
        switch (contentType) {
          case 'Movie':
            recs = await this.moviesService.getRecommendations(contentId, 2);
            if (recs.statusCode === 200) recommendations.push(...recs.data);
            break;
          case 'TvShow':
            recs = await this.tvshowService.getRecommendations(contentId, 2);
            if (recs.statusCode === 200) recommendations.push(...recs.data);
            break;
          case 'Season':
            recs = await this.seasonService.getRecommendations(contentId, 2);
            if (recs.statusCode === 200) recommendations.push(...recs.data);
            break;
          case 'Episode':
            recs = await this.episodeService.getRecommendations(contentId, 2);
            if (recs.statusCode === 200) recommendations.push(...recs.data);
            break;
        }
      }
      return recommendations.slice(0, 10);
    };

    try {
      const recommendations = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
      return this.responseService.responseSuccess(recommendations);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async updateSharing(userId: string, watchlistItemId: string, dto: { isPublic?: boolean; sharedWith?: string[] }) {
    try {
      const item = await this.watchlistModel.findOne({ _id: watchlistItemId, user: userId }).exec();
      if (!item) {
        throw new NotFoundException('Watchlist item not found');
      }

      if (typeof dto.isPublic === 'boolean') {
        item.isPublic = dto.isPublic;
      }

      if (dto.sharedWith) {
        item.sharedWith = dto.sharedWith.map(id => new Types.ObjectId(id));
      }

      const updatedItem = await item.save();
      await CommonHelpers.invalidateCache([`watchlist:${userId}`]);

      if (dto.sharedWith && dto.sharedWith.length > 0) {
        const ownerResponse = await this.userService.findOne(userId);
        const owner = ownerResponse.data;
        await this.notificationService.notifyUsers({
          userIds: dto.sharedWith,
          message: `${owner.username} has shared a watchlist item with you.`,
        });
      }

      return this.responseService.responseUpdateSuccess('Sharing settings updated', updatedItem);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async getSharedWatchlist(viewerId: string, ownerId: string) {
    const cacheKey = `watchlist:${ownerId}:shared:${viewerId}`;
    const fetchFn = async () => {
      const owner = await this.userService.findOne(ownerId);
      if (owner.statusCode !== 200) throw new NotFoundException('Owner not found');

      const query = {
        user: ownerId,
        $or: [
          { isPublic: true },
          { sharedWith: viewerId }
        ]
      };

      return this.watchlistModel.find(query).populate('content').sort({ addedAt: -1 }).exec();
    };

    try {
      const watchlist = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
      return this.responseService.responseSuccess(watchlist);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  private async validateContent(contentId: string, contentType: string): Promise<void> {
    if (!Types.ObjectId.isValid(contentId)) {
      throw new BadRequestException(`Invalid ${contentType} ID: ${contentId}`);
    }
    let content;
    switch (contentType) {
      case 'Movie':
        content = await this.moviesService.findOne(contentId);
        break;
      case 'TvShow':
        content = await this.tvshowService.findOne(contentId);
        break;
      case 'Season':
        content = await this.seasonService.findOne(contentId);
        break;
      case 'Episode':
        content = await this.episodeService.findOne(contentId);
        break;
      default:
        throw new BadRequestException('Invalid content type');
    }
    if (!content || content.statusCode !== 200) throw new NotFoundException(`${contentType} not found`);
  }
}
