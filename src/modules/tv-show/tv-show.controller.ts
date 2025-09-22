import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  BadRequestException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TvShowService } from './tv-show.service';
import { TvShow } from './entities/tv-show.entity';
import { Season } from '../season/entities/season.entity';
import { Episode } from '../episode/entities/episode.entity';
import { CreateSeasonDto, UpdateSeasonDto } from '../season/dto/create-season.dto';
import { CreateTvShowDto, QueryTvShowDto, UpdateTvShowDto, RateTvShowDto } from './dto/create-tv-show.dto';

@ApiTags('TV-Show Management')
@Controller('tv-shows')
export class TvShowController {
  constructor(private readonly tvShowService: TvShowService) {}

  // --- TV Show Endpoints ---

  @Post()
  @ApiOperation({ summary: 'Create a new TV show' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'TV show created.', type: TvShow })
  @ApiBody({ type: CreateTvShowDto })
  async create(@Body() createTvShowDto: CreateTvShowDto) {
    return this.tvShowService.create(createTvShowDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all TV shows with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'genre', required: false, type: String, example: 'Action' })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'Stranger' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, example: 'popularity' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], example: 'desc' })
  @ApiQuery({ name: 'releaseDate', required: false, type: String, example: '2020-01-01' })
  @ApiQuery({ name: 'country', required: false, type: String, example: 'USA' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of TV shows.', type: [TvShow] })
  async findAll(@Query() queryDto: QueryTvShowDto) {
    return this.tvShowService.findAll(queryDto);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending TV shows' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of trending TV shows.', type: [TvShow] })
  async getTrending(@Query('limit') limit: number = 10) {
    return this.tvShowService.getTrending(limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a TV show by ID' })
  @ApiParam({ name: 'id', description: 'TV show ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'TV show details.', type: TvShow })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'TV show not found.' })
  async findOne(@Param('id') id: string) {
    return this.tvShowService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a TV show' })
  @ApiParam({ name: 'id', description: 'TV show ID' })
  @ApiBody({ type: UpdateTvShowDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'TV show updated.', type: TvShow })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'TV show not found.' })
  async update(@Param('id') id: string, @Body() updateTvShowDto: UpdateTvShowDto) {
    return this.tvShowService.update(id, updateTvShowDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a TV show' })
  @ApiParam({ name: 'id', description: 'TV show ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'TV show deleted.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'TV show not found.' })
  async remove(@Param('id') id: string) {
    return this.tvShowService.remove(id);
  }

  @Post(':id/rate')
  @ApiOperation({ summary: 'Rate a TV show' })
  @ApiParam({ name: 'id', description: 'TV show ID' })
  @ApiBody({ type: RateTvShowDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Rating added.', type: TvShow })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'TV show not found.' })
  async rate(@Param('id') id: string, @Body() rateDto: RateTvShowDto) {
    return this.tvShowService.rateTvShow(id, rateDto.rating);
  }

  @Get(':id/recommendations')
  @ApiOperation({ summary: 'Get recommended TV shows' })
  @ApiParam({ name: 'id', description: 'TV show ID' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 5 })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of recommended TV shows.', type: [TvShow] })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'TV show not found.' })
  async getRecommendations(@Param('id') id: string, @Query('limit') limit: number = 5) {
    return this.tvShowService.getRecommendations(id, limit);
  }

  // --- Season Endpoints ---

//   @Post(':id/seasons')
//   @ApiOperation({ summary: 'Add a season to a TV show' })
//   @ApiParam({ name: 'id', description: 'TV show ID' })
//   @ApiBody({ type: CreateSeasonDto })
//   @ApiResponse({ status: HttpStatus.CREATED, description: 'Season created.', type: Season })
//   @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'TV show not found.' })
//   async addSeason(@Param('id') tvShowId: string, @Body() createSeasonDto: CreateSeasonDto) {
//     return this.tvShowService.addSeason(tvShowId, createSeasonDto);
//   }

  @Get(':id/seasons')
  @ApiOperation({ summary: 'Get all seasons of a TV show' })
  @ApiParam({ name: 'id', description: 'TV show ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of seasons.', type: [Season] })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'TV show not found.' })
  async getSeasons(@Param('id') tvShowId: string) {
    return this.tvShowService.getSeasons(tvShowId);
  }

  // @Get(':id/seasons/:seasonId')
  // @ApiOperation({ summary: 'Get a specific season' })
  // @ApiParam({ name: 'id', description: 'TV show ID' })
  // @ApiParam({ name: 'seasonId', description: 'Season ID' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Season details.', type: Season })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Season or TV show not found.' })
  // async getSeason(@Param('id') tvShowId: string, @Param('seasonId') seasonId: string) {
  //   return this.tvShowService.getSeason(seasonId);
  // }

  // @Patch(':id/seasons/:seasonId')
  // @ApiOperation({ summary: 'Update a season' })
  // @ApiParam({ name: 'id', description: 'TV show ID' })
  // @ApiParam({ name: 'seasonId', description: 'Season ID' })
  // @ApiBody({ type: UpdateSeasonDto })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Season updated.', type: Season })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Season or TV show not found.' })
  // async updateSeason(
  //   @Param('id') tvShowId: string,
  //   @Param('seasonId') seasonId: string,
  //   @Body() updateSeasonDto: UpdateSeasonDto,
  // ) {
  //   return this.tvShowService.updateSeason(seasonId, updateSeasonDto);
  // }

  // @Delete(':id/seasons/:seasonId')
  // @ApiOperation({ summary: 'Delete a season' })
  // @ApiParam({ name: 'id', description: 'TV show ID' })
  // @ApiParam({ name: 'seasonId', description: 'Season ID' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Season deleted.' })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Season or TV show not found.' })
  // async removeSeason(@Param('id') tvShowId: string, @Param('seasonId') seasonId: string) {
  //   return this.tvShowService.removeSeason(seasonId);
  // }

  // --- Episode Endpoints ---

//   @Post(':id/seasons/:seasonId/episodes')
//   @ApiOperation({ summary: 'Add an episode to a season' })
//   @ApiParam({ name: 'id', description: 'TV show ID' })
//   @ApiParam({ name: 'seasonId', description: 'Season ID' })
//   @ApiBody({ type: CreateEpisodeDto })
//   @ApiResponse({ status: HttpStatus.CREATED, description: 'Episode created.', type: Episode })
//   @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Season or TV show not found.' })
//   async addEpisode(
//     @Param('id') tvShowId: string,
//     @Param('seasonId') seasonId: string,
//     @Body() createEpisodeDto: CreateEpisodeDto,
//   ) {
//     return this.tvShowService.addEpisode(seasonId, createEpisodeDto);
//   }

  // @Get(':id/seasons/:seasonId/episodes')
  // @ApiOperation({ summary: 'Get all episodes of a season' })
  // @ApiParam({ name: 'id', description: 'TV show ID' })
  // @ApiParam({ name: 'seasonId', description: 'Season ID' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'List of episodes.', type: [Episode] })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Season or TV show not found.' })
  // async getEpisodes(@Param('id') tvShowId: string, @Param('seasonId') seasonId: string) {
  //   return this.tvShowService.getEpisodes(seasonId);
  // }

  // @Get(':id/seasons/:seasonId/episodes/:episodeId')
  // @ApiOperation({ summary: 'Get a specific episode' })
  // @ApiParam({ name: 'id', description: 'TV show ID' })
  // @ApiParam({ name: 'seasonId', description: 'Season ID' })
  // @ApiParam({ name: 'episodeId', description: 'Episode ID' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Episode details.', type: Episode })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Episode, season, or TV show not found.' })
  // async getEpisode(
  //   @Param('id') tvShowId: string,
  //   @Param('seasonId') seasonId: string,
  //   @Param('episodeId') episodeId: string,
  // ) {
  //   return this.tvShowService.getEpisode(episodeId);
  // }

  // @Patch(':id/seasons/:seasonId/episodes/:episodeId')
  // @ApiOperation({ summary: 'Update an episode' })
  // @ApiParam({ name: 'id', description: 'TV show ID' })
  // @ApiParam({ name: 'seasonId', description: 'Season ID' })
  // @ApiParam({ name: 'episodeId', description: 'Episode ID' })
  // @ApiBody({ type: UpdateEpisodeDto })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Episode updated.', type: Episode })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Episode, season, or TV show not found.' })
  // async updateEpisode(
  //   @Param('id') tvShowId: string,
  //   @Param('seasonId') seasonId: string,
  //   @Param('episodeId') episodeId: string,
  //   @Body() updateEpisodeDto: UpdateEpisodeDto,
  // ) {
  //   return this.tvShowService.updateEpisode(episodeId, updateEpisodeDto);
  // }

  // @Delete(':id/seasons/:seasonId/episodes/:episodeId')
  // @ApiOperation({ summary: 'Delete an episode' })
  // @ApiParam({ name: 'id', description: 'TV show ID' })
  // @ApiParam({ name: 'seasonId', description: 'Season ID' })
  // @ApiParam({ name: 'episodeId', description: 'Episode ID' })
  // @ApiResponse({ status: HttpStatus.OK, description: 'Episode deleted.' })
  // @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Episode, season, or TV show not found.' })
  // async removeEpisode(
  //   @Param('id') tvShowId: string,
  //   @Param('seasonId') seasonId: string,
  //   @Param('episodeId') episodeId: string,
  // ) {
  //   return this.tvShowService.removeEpisode(episodeId);
  // }

  // --- Cast and Crew Endpoints ---

  @Post(':id/cast')
  @ApiOperation({ summary: 'Add cast members to a TV show' })
  @ApiParam({ name: 'id', description: 'TV show ID' })
  @ApiBody({
    description: 'Array of cast members',
    type: [CreateTvShowDto],
    examples: {
      cast: {
        value: [{ person: '60d21b4667d0d8992e610c89', character: 'Eleven', order: 1 }],
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cast members added.', type: TvShow })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'TV show or person not found.' })
  async addCast(
    @Param('id') tvShowId: string,
    @Body() cast: { person: string; character: string; order: number }[],
  ) {
    return this.tvShowService.addCast(tvShowId, cast);
  }

  @Delete(':id/cast/:personId')
  @ApiOperation({ summary: 'Remove a cast member from a TV show' })
  @ApiParam({ name: 'id', description: 'TV show ID' })
  @ApiParam({ name: 'personId', description: 'Person ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Cast member removed.', type: TvShow })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'TV show or cast member not found.' })
  async removeCast(@Param('id') tvShowId: string, @Param('personId') personId: string) {
    return this.tvShowService.removeCast(tvShowId, personId);
  }

  @Post(':id/crew')
  @ApiOperation({ summary: 'Add crew members to a TV show' })
  @ApiParam({ name: 'id', description: 'TV show ID' })
  @ApiBody({
    description: 'Array of crew members',
    type: [CreateTvShowDto],
    examples: {
      crew: {
        value: [{ person: '60d21b4667d0d8992e610c90', role: 'Director', department: 'Directing' }],
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Crew members added.', type: TvShow })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'TV show or person not found.' })
  async addCrew(
    @Param('id') tvShowId: string,
    @Body() crew: { person: string; role: string; department: string }[],
  ) {
    return this.tvShowService.addCrew(tvShowId, crew);
  }

  @Delete(':id/crew/:personId')
  @ApiOperation({ summary: 'Remove a crew member from a TV show' })
  @ApiParam({ name: 'id', description: 'TV show ID' })
  @ApiParam({ name: 'personId', description: 'Person ID' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Crew member removed.', type: TvShow })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'TV show or crew member not found.' })
  async removeCrew(@Param('id') tvShowId: string, @Param('personId') personId: string) {
    return this.tvShowService.removeCrew(tvShowId, personId);
  }
}