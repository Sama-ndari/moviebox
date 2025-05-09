// src/reviews/reviews.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { CommonHelpers } from 'src/helpers/helpers';

@Injectable()
export class ReviewsService {
  constructor(@InjectModel(Review.name) private reviewModel: Model<Review>) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    const review = new this.reviewModel(createReviewDto);
    return review.save();
  }

  async findAll(): Promise<Review[]> {
    return CommonHelpers.retry(() => this.reviewModel.find().populate('targetId userId').exec());
  }

  async findOne(id: string): Promise<Review> {
    const review = await CommonHelpers.retry(() => this.reviewModel.findById(id).populate('targetId userId').exec());
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  async update(id: string, updateReviewDto: UpdateReviewDto): Promise<Review> {
    const review = await CommonHelpers.retry(() =>
      this.reviewModel.findByIdAndUpdate(id, updateReviewDto, { new: true }).exec()
    );
    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
    return review;
  }

  async remove(id: string): Promise<void> {
    const result = await CommonHelpers.retry(() => this.reviewModel.findByIdAndDelete(id).exec());
    if (!result) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }
  }

  async findByFilter(filter: { targetId?: string; targetType?: string; userId?: string; rating?: number }): Promise<Review[]> {
    console.log('Filter:', filter);
    if (filter.rating !== undefined) {
      filter.rating = Number(filter.rating);
    }

    const query: any = {};

    if (filter.targetId) {
      query.targetId = filter.targetId;
    }
    if (filter.targetType) {
      query.targetType = filter.targetType;
    }
    if (filter.userId) {
      query.userId = filter.userId;
    }
    if (filter.rating !== undefined) {
      query.rating = filter.rating;
    }

    console.log('Mongoose Query:', query);

    try {
      return await this.reviewModel.find(query).populate('targetId userId').exec();
    } catch (error) {
      console.error('MongoDB query error:', error);
      throw error;
    }
  }
}