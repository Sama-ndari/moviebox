// src/reviews/reviews.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('Reviews Management')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  @ApiResponse({ status: 200, description: 'List of reviews' })
  findAll() {
    return this.reviewsService.findAll();
  }

  @Get('by-target')
  @ApiOperation({ summary: 'Get reviews by target ID and optionally target type' })
  @ApiQuery({ name: 'targetId', required: true, description: 'ID of the target' })
  @ApiQuery({ name: 'targetType', required: false, description: 'Type of the target (User or Produit)' })
  async findByTarget(
    @Query('targetId') targetId: string,
    @Query('targetType') targetType?: string,
  ) {
    const filter: any = { targetId: targetId };
    if (targetType) {
      filter.targetType = targetType;
    }
    return this.reviewsService.findByFilter(filter);
  }

  @Get('by-user')
  @ApiOperation({ summary: 'Get reviews by user ID' })
  @ApiQuery({ name: 'userId', required: true, description: 'ID of the user' })
  async findByClient(@Query('userId') userId: string) {
    return this.reviewsService.findByFilter({ userId: userId });
  }

  @Get('by-rating')
  @ApiOperation({ summary: 'Get reviews by rating' })
  @ApiQuery({ name: 'rating', required: true, description: 'Rating of the review from 0 to 5' })
  async findByRating(@Query('rating') rating: string) {
    const ratingNum = parseFloat(rating);
    return this.reviewsService.findByFilter({ rating: ratingNum });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a review by ID' })
  @ApiResponse({ status: 200, description: 'Review details' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(id, updateReviewDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}