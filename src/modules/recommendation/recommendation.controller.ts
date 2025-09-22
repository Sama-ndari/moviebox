import { Controller, Get, Param } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('recommendations')
@Controller('recommendations')
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Get movie recommendations for a user' })
  @ApiResponse({ status: 200, description: 'A list of recommended movies.' })
  getRecommendations(@Param('userId') userId: string) {
    return this.recommendationService.getRecommendations(userId);
  }
}
