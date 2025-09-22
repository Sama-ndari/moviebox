// src/reviews/reviews.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { CommonHelpers } from '../../helpers/helpers';
import { ResponseService } from '../../helpers/respon-server/ResponseServer';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<Review>,
    private readonly responseService: ResponseService,
  ) {}

  async create(createReviewDto: CreateReviewDto) {
    try {
      const review = new this.reviewModel(createReviewDto);
      const savedReview = await CommonHelpers.retry(() => review.save());
      await CommonHelpers.invalidateCacheByPattern('reviews:*');
      return this.responseService.responseCreateSuccess('Review created successfully', savedReview);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async findAll() {
    const cacheKey = 'reviews:all';
    const fetchFn = () => this.reviewModel.find().populate('targetId userId').exec();

    try {
      const reviews = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
      return this.responseService.responseSuccess(reviews);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async findOne(id: string) {
    const cacheKey = `review:${id}`;
    const fetchFn = async () => {
      const review = await this.reviewModel.findById(id).populate('targetId userId').exec();
      if (!review) throw new NotFoundException(`Review with ID ${id} not found`);
      return review;
    };

    try {
      const review = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
      return this.responseService.responseSuccess(review);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async update(id: string, updateReviewDto: UpdateReviewDto) {
    try {
      const updatedReview = await CommonHelpers.retry(() => this.reviewModel.findByIdAndUpdate(id, updateReviewDto, { new: true }).exec());
      if (!updatedReview) throw new NotFoundException(`Review with ID ${id} not found`);
      await CommonHelpers.invalidateCache([`review:${id}`]);
      await CommonHelpers.invalidateCacheByPattern('reviews:*');
      return this.responseService.responseUpdateSuccess('Review updated successfully', updatedReview);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }
  
  async remove(id: string) {
    try {
      const result = await CommonHelpers.retry(() => this.reviewModel.findByIdAndDelete(id).exec());
      if (!result) throw new NotFoundException(`Review with ID ${id} not found`);
      await CommonHelpers.invalidateCache([`review:${id}`]);
      await CommonHelpers.invalidateCacheByPattern('reviews:*');
      return this.responseService.responseDeleteSuccess('Review deleted successfully', null);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }

  async findByFilter(filter: any) {
    const cacheKey = `reviews:filter:${JSON.stringify(filter)}`;
    const fetchFn = () => this.reviewModel.find(filter).populate('targetId userId').exec();

    try {
      const reviews = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
      return this.responseService.responseSuccess(reviews);
    } catch (error) {
      return this.responseService.responseError(error.message);
    }
  }
}