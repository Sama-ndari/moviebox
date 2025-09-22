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
import { SeasonService } from './season.service';
import { CreateSeasonDto, UpdateSeasonDto, QuerySeasonDto, RateSeasonDto } from './dto/create-season.dto';
import { Season } from './entities/season.entity';

@ApiTags('Season Management')
@Controller('seasons')
export class SeasonController {
  constructor(private readonly seasonService: SeasonService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new season' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Season created.', type: Season })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'TV show not found.' })
  @ApiBody({ type: CreateSeasonDto })
  async create(@Body() createSeasonDto: CreateSeasonDto) {
    return this.seasonService.create(createSeasonDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all seasons with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'tvShow', required: false, type: String, example: '60d21b4667d0d8992e610c89' })
  @ApiQuery({ name: 'releaseDate', required: false, type: String, example: '2023-01-01' })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'season' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'popularity' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], example: 'desc' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of seasons.', type: [Season] })
  async findAll(@Query() queryDto: QuerySeasonDto) {
    return this.seasonService.findAll(queryDto);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending seasons' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of trending seasons.', type: [Season] })
  async getTrending(@Query('limit') limit: number = 10) {
    return this.seasonService.getTrending(limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a season by ID' })
  @ApiParam({ name: 'id', description: 'Season ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Season details.', type: Season })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Season not found.' })
  async findOne(@Param('id') id: string) {
    return this.seasonService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a season' })
  @ApiParam({ name: 'id', description: 'Season ID' })
  @ApiBody({ type: UpdateSeasonDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Season updated.', type: Season })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Season not found.' })
  async update(@Param('id') id: string, @Body() updateSeasonDto: UpdateSeasonDto) {
    return this.seasonService.update(id, updateSeasonDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a season' })
  @ApiParam({ name: 'id', description: 'Season ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Season deleted.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Season not found.' })
  async remove(@Param('id') id: string) {
    return this.seasonService.remove(id);
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Rate a season' })
  @ApiParam({ name: 'id', description: 'Season ID' })
  @ApiBody({ type: RateSeasonDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rating added.', type: Season })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Season not found.' })
  async rate(@Param('id') id: string, @Body() rateDto: RateSeasonDto) {
    return this.seasonService.rateSeason(id, rateDto.rating);
  }

  @Get(':id/recommendations')
  @ApiOperation({ summary: 'Get recommended seasons' })
  @ApiParam({ name: 'id', description: 'Season ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of recommended seasons.', type: [Season] })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Season not found.' })
  async getRecommendations(@Param('id') id: string, @Query('limit') limit: number = 5) {
    return this.seasonService.getRecommendations(id, limit);
  }

  @Get(':id/episodes')
  @ApiOperation({ summary: 'Get all episodes of a season' })
  @ApiParam({ name: 'id', description: 'Season ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of episodes.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Season not found.' })
  async getEpisodes(@Param('id') id: string) {
    return this.seasonService.getEpisodes(id);
  }
}