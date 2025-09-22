import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AddToWatchHistoryDto, UpdateWatchHistoryDto } from './dto/addwatchHistory.dto';
import { WatchHistory } from './entities/watch-history.entity';
import { MoviesService } from '../movie/movie.service';
import { TvShowService } from '../tv-show/tv-show.service';
import { SeasonService } from '../season/season.service';
import { EpisodeService } from '../episode/episode.service';
import { UserService } from '../user/user.service';
import { NotificationService } from '../notification/notification.service';
import { CommonHelpers } from '../../helpers/helpers';
import { NotificationType } from '../notification/entities/notification.entity';
import { ResponseService } from '../../helpers/respon-server/ResponseServer';

@Injectable()
export class WatchHistoryService {
  constructor(
    @InjectModel(WatchHistory.name) private watchHistoryModel: Model<WatchHistory>,
    private readonly userService: UserService,
    private readonly moviesService: MoviesService,
    private readonly tvshowService: TvShowService,
    private readonly seasonService: SeasonService,
    private readonly episodeService: EpisodeService,
    private readonly notificationService: NotificationService,
    private readonly responseService: ResponseService,
  ) {}

  async addToHistory(userId: string, dto: AddToWatchHistoryDto) {
    try {
      const { contentId, contentType, durationWatched, completed, rating, watchContext, lastPausePoint } = dto;

      const userResponse = await this.userService.findOne(userId);
      if (userResponse.statusCode !== 200) throw new NotFoundException('User not found');

      await this.validateContent(contentId, contentType);

      const historyItem = new this.watchHistoryModel({
        user: userId,
        content: contentId,
        contentType,
        durationWatched,
        completed,
        rating,
        watchContext,
        lastPausePoint,
      });

      const savedItem = await CommonHelpers.retry(() => historyItem.save());

      if (completed) {
        await this.notificationService.notifyUser({ userId, message: `You finished watching "${contentId}"! Rate it now!`, type: NotificationType.GENERAL });
      }

      await CommonHelpers.invalidateCache([`watch-history:${userId}`]);
      return this.responseService.responseCreateSuccess('Content added to watch history', savedItem);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async getHistory(userId: string) {
    const cacheKey = `watch-history:${userId}`;
    const fetchFn = async () => {
      const userResponse = await this.userService.findOne(userId);
      if (userResponse.statusCode !== 200) throw new NotFoundException('User not found');

      return this.watchHistoryModel.find({ user: userId }).populate('content').sort({ watchedAt: -1 }).exec();
    };

    try {
      const history = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
      return this.responseService.responseSuccess(history);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async getAnalytics(userId: string) {
    const cacheKey = `watch-history:analytics:${userId}`;
    const fetchFn = async () => {
      const historyResponse = await this.getHistory(userId);
      if (historyResponse.statusCode !== 200) throw new Error('Failed to fetch watch history');
      const history = historyResponse.data;

      const totalWatched = history.length;
      let totalHours = 0;
      const genreCount: { [key: string]: number } = {};

      for (const item of history) {
        const contentId = (item.content as any)._id.toString();
        const contentResponse = await this.getContentDetails(contentId, item.contentType);
        if (contentResponse.statusCode === 200) {
          const content = contentResponse.data;
          totalHours += item.durationWatched / 60;
          const genre = content.genres?.[0] || 'Unknown';
          genreCount[genre] = (genreCount[genre] || 0) + 1;
        }
      }

      const favoriteGenre = Object.entries(genreCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
      return { totalWatched, favoriteGenre, totalHours: parseFloat(totalHours.toFixed(2)) };
    };

    try {
      const analytics = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
      return this.responseService.responseSuccess(analytics);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async updateHistory(userId: string, historyId: string, dto: UpdateWatchHistoryDto) {
    try {
      const historyItem = await CommonHelpers.retry(() => this.watchHistoryModel.findOne({ _id: historyId, user: userId }).exec());
      if (!historyItem) throw new NotFoundException('History item not found');

      Object.assign(historyItem, dto);
      const updatedItem = await CommonHelpers.retry(() => historyItem.save());

      if (dto.completed) {
        await this.notificationService.notifyUser({ userId, message: `You finished watching "${historyItem.content}"!`, type: NotificationType.GENERAL });
      }

      await CommonHelpers.invalidateCache([`watch-history:${userId}`]);
      await CommonHelpers.invalidateCache([`watch-history-item:${historyId}`]);
      return this.responseService.responseUpdateSuccess('Watch history entry updated', updatedItem);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async deleteHistory(userId: string, historyId: string) {
    try {
      const result = await CommonHelpers.retry(() => this.watchHistoryModel.deleteOne({ _id: historyId, user: userId }).exec());
      if (result.deletedCount === 0) throw new NotFoundException('History item not found');

      await CommonHelpers.invalidateCache([`watch-history:${userId}`]);
      await CommonHelpers.invalidateCache([`watch-history-item:${historyId}`]);
      return this.responseService.responseDeleteSuccess('Watch history entry deleted', null);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  private async validateContent(contentId: string, contentType: string): Promise<void> {
    let contentResponse;
    switch (contentType) {
      case 'Movie':
        contentResponse = await this.moviesService.findOne(contentId);
        break;
      case 'TvShow':
        contentResponse = await this.tvshowService.findOne(contentId);
        break;
      case 'Season':
        contentResponse = await this.seasonService.findOne(contentId);
        break;
      case 'Episode':
        contentResponse = await this.episodeService.findOne(contentId);
        break;
      default:
        throw new BadRequestException('Invalid content type');
    }
    if (!contentResponse || contentResponse.statusCode !== 200) throw new NotFoundException(`${contentType} not found`);
  }

  private async getContentDetails(contentId: string, contentType: string) {
    switch (contentType) {
      case 'Movie':
        return this.moviesService.findOne(contentId);
      case 'TvShow':
        return this.tvshowService.findOne(contentId);
      case 'Season':
        return this.seasonService.findOne(contentId);
      case 'Episode':
        return this.episodeService.findOne(contentId);
      default:
        throw new BadRequestException('Invalid content type');
    }
  }
}