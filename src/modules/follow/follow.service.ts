import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Follow } from './entities/follow.entity';
import { ResponseService } from '../../helpers/respon-server/ResponseServer';

@Injectable()
export class FollowService {
  constructor(
    @InjectModel(Follow.name) private followModel: Model<Follow>,
    private readonly responseService: ResponseService,
  ) {}

  async follow(followerId: string, followingId: string) {
    try {
      const follow = new this.followModel({ follower: followerId, following: followingId });
      await follow.save();
      return this.responseService.responseSuccess({ message: 'Successfully followed.' });
    } catch (error) {
      return this.responseService.responseError('Already following or invalid IDs.');
    }
  }

  async unfollow(followerId: string, followingId: string) {
    try {
      const result = await this.followModel.deleteOne({ follower: followerId, following: followingId }).exec();
      if (result.deletedCount === 0) {
        return this.responseService.responseError('Not following.');
      }
      return this.responseService.responseSuccess({ message: 'Successfully unfollowed.' });
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async getFollowers(personId: string) {
    return this.followModel.find({ following: personId }).select('follower').exec();
  }
}
