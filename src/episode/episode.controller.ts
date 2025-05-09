import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { EpisodeService } from './episode.service';
import { CreateEpisodeDto, UpdateEpisodeDto, QueryEpisodeDto, RateEpisodeDto, WatchProgressDto } from './dto/create-episode.dto';
import { Episode } from './entities/episode.entity';

@ApiTags('Episode Management')
@Controller('episodes')
export class EpisodeController {
  constructor(private readonly episodeService: EpisodeService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new episode' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Episode created.', type: Episode })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Season not found.' })
  @ApiBody({ type: CreateEpisodeDto })
  async create(@Body() createEpisodeDto: CreateEpisodeDto) {
    return this.episodeService.create(createEpisodeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all episodes with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'season', required: false, type: String, example: '60d21b4667d0d8992e610c89' })
  @ApiQuery({ name: 'releaseDate', required: false, type: String, example: '2023-01-01' })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'chapter' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'popularity' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], example: 'desc' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of episodes.', type: [Episode] })
  async findAll(@Query() queryDto: QueryEpisodeDto) {
    return this.episodeService.findAll(queryDto);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending episodes' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of trending episodes.', type: [Episode] })
  async getTrending(@Query('limit') limit: number = 10) {
    return this.episodeService.getTrending(limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an episode by ID' })
  @ApiParam({ name: 'id', description: 'Episode ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Episode details.', type: Episode })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Episode not found.' })
  async findOne(@Param('id') id: string) {
    return this.episodeService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an episode' })
  @ApiParam({ name: 'id', description: 'Episode ID' })
  @ApiBody({ type: UpdateEpisodeDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Episode updated.', type: Episode })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Episode not found.' })
  async update(@Param('id') id: string, @Body() updateEpisodeDto: UpdateEpisodeDto) {
    return this.episodeService.update(id, updateEpisodeDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an episode' })
  @ApiParam({ name: 'id', description: 'Episode ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Episode deleted.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Episode not found.' })
  async remove(@Param('id') id: string) {
    return this.episodeService.remove(id);
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Rate an episode' })
  @ApiParam({ name: 'id', description: 'Episode ID' })
  @ApiBody({ type: RateEpisodeDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rating added.', type: Episode })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Episode not found.' })
  async rate(@Param('id') id: string, @Body() rateDto: RateEpisodeDto) {
    return this.episodeService.rateEpisode(id, rateDto.rating);
  }

  @Post(':id/watch-progress')
  @ApiOperation({ summary: 'Update watch progress for an episode' })
  @ApiParam({ name: 'id', description: 'Episode ID' })
  @ApiBody({ type: WatchProgressDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Watch progress updated.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Episode not found.' })
  async updateWatchProgress(@Param('id') id: string, @Body() watchProgressDto: WatchProgressDto) {
    return this.episodeService.updateWatchProgress(id, watchProgressDto);
  }

  @Get(':id/recommendations')
  @ApiOperation({ summary: 'Get recommended episodes' })
  @ApiParam({ name: 'id', description: 'Episode ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of recommended episodes.', type: [Episode] })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Episode not found.' })
  async getRecommendations(@Param('id') id: string, @Query('limit') limit: number = 5) {
    return this.episodeService.getRecommendations(id, limit);
  }
}