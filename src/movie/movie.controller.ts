import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { MoviesService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entities/movie.entity';

@ApiTags('Movies Management')
@Controller('movies')
export class MoviesController {
  constructor(private readonly moviesService: MoviesService) {}

  @Get()
  @ApiOperation({ summary: 'Retrieve all movies with optional filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Items per page' })
  @ApiQuery({ name: 'genre', required: false, type: String, example: 'Action', description: 'Filter by genre' })
  @ApiResponse({ status: 200, description: 'List of movies', type: [Movie] })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('genre') genre?: string,
  ) {
    return this.moviesService.findAll(page, limit, genre);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new movie' })
  @ApiResponse({ status: 201, description: 'Movie created', type: Movie })
  async create(@Body() createMovieDto: CreateMovieDto) {
    return this.moviesService.create(createMovieDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing movie' })
  @ApiResponse({ status: 200, description: 'Movie updated', type: Movie })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async update(@Param('id') id: string, @Body() updateMovieDto: UpdateMovieDto) {
    return this.moviesService.update(id, updateMovieDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a movie' })
  @ApiResponse({ status: 200, description: 'Movie deleted' })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async remove(@Param('id') id: string) {
    return this.moviesService.remove(id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search movies by title or description' })
  @ApiQuery({ name: 'query', required: true, type: String, example: 'Dark Knight', description: 'Search term' })
  @ApiResponse({ status: 200, description: 'Search results', type: [Movie] })
  async search(@Query('query') query: string) {
    return this.moviesService.search(query);
  }

  @Get('filter')
  @ApiOperation({ summary: 'Filter movies with advanced criteria' })
  @ApiQuery({ name: 'releaseDate', required: false, description: "Format: 'YYYY-MM-DD'" })
  @ApiQuery({ name: 'genres', required: false, description: 'Comma-separated list of genres' })
  @ApiQuery({ name: 'status', required: false, description: 'Status of the movie' })
  @ApiQuery({ name: 'contentRating', required: false, description: 'Content rating of the movie' })
  @ApiQuery({ name: 'ratingCount', required: false, description: 'Minimum rating count' })
  @ApiQuery({ name: 'duration', required: false, description: 'Duration in minutes' })
  @ApiQuery({ name: 'budget', required: false, description: 'Minimum budget' })
  @ApiQuery({ name: 'revenue', required: false, description: 'Minimum revenue' })
  @ApiQuery({ name: 'voteAverage', required: false, description: 'Minimum vote average' })
  @ApiQuery({ name: 'voteCount', required: false, description: 'Minimum vote count' })
  @ApiQuery({ name: 'popularity', required: false, description: 'Minimum popularity score' })
  @ApiQuery({ name: 'person', required: false, description: 'Person associated with the movie (actor, director, etc.)' })
  @ApiQuery({ name: 'isActive', required: false, description: 'Whether the movie is active (true/false)' })
  @ApiQuery({ name: 'isAdult', required: false, description: 'Whether the movie is for adults (true/false)' })
  @ApiQuery({ name: 'language', required: false, description: 'Language of the movie' })
  @ApiQuery({ name: 'country', required: false, description: 'Country of production' })
  @ApiQuery({ name: 'productionCompany', required: false, description: 'Production company name' })
  @ApiQuery({ name: 'director', required: false, description: 'Director of the movie' })
  @ApiQuery({ name: 'writer', required: false, description: 'Writer of the movie' })
  @ApiResponse({ status: 200, description: 'Filtered list of movies', type: [Movie] })
  async filter(
    @Query('releaseDate') releaseDate?: string,
    @Query('genres') genres?: string,
    @Query('status') status?: string,
    @Query('contentRating') contentRating?: string,
    @Query('ratingCount') ratingCount?: number,
    @Query('duration') duration?: number,
    @Query('budget') budget?: number,
    @Query('revenue') revenue?: number,
    @Query('voteAverage') voteAverage?: number,
    @Query('voteCount') voteCount?: number,
    @Query('popularity') popularity?: number,
    @Query('person') person?: string,
    @Query('isActive') isActive?: boolean,
    @Query('isAdult') isAdult?: boolean,
    @Query('language') language?: string,
    @Query('country') country?: string,
    @Query('productionCompany') productionCompany?: string,
    @Query('director') director?: string,
    @Query('writer') writer?: string,
  ) {
    console.log('Received filter query:', { releaseDate, genres, status, 
      contentRating, ratingCount, duration, budget, revenue, voteAverage,
       voteCount, popularity, person, isActive, isAdult, language, country,
        productionCompany, director, writer });
    return this.moviesService.filter({
      releaseDate,
      genres,
      status,
      contentRating,
      ratingCount,
      duration,
      budget,
      revenue,
      voteAverage,
      voteCount,
      popularity,
      person,
      isActive,
      isAdult,
      language,
      country,
      productionCompany,
      director,
      writer,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a movie by ID' })
  @ApiResponse({ status: 200, description: 'Movie details', type: Movie })
  @ApiResponse({ status: 404, description: 'Movie not found' })
  async findOne(@Param('id') id: string) {
    return this.moviesService.findOne(id);
  }

  @Post(':id/cast')
  @ApiOperation({ summary: 'Add a cast member to a movie' })
  @ApiResponse({ status: 200, description: 'Cast member added', type: Movie })
  @ApiResponse({ status: 404, description: 'Movie or person not found' })
  @ApiBody({
    description: 'Details of the cast member to add',
    required: true,
    type: Object,
    schema: {
      type: 'object',
      properties: {
        person: { type: 'string', description: 'ID of the person', example: '12345' },
        character: { type: 'string', description: 'Character name', example: 'John Doe' },
        order: { type: 'number', description: 'Order of appearance', example: 1 },
      },
      required: ['person', 'character', 'order'],
    },
  })
  async addCast(
    @Param('id') movieId: string,
    @Body() castMember: { person: string; character: string; order: number },
  ) {
    return this.moviesService.addCast(movieId, castMember);
  }

  @Delete(':id/cast/:personId')
  @ApiOperation({ summary: 'Remove a cast member from a movie' })
  @ApiResponse({ status: 200, description: 'Cast member removed', type: Movie })
  @ApiResponse({ status: 404, description: 'Movie or cast member not found' })
  async removeCast(@Param('id') movieId: string, @Param('personId') personId: string) {
    return this.moviesService.removeCast(movieId, personId);
  }

  @Post(':id/crew')
  @ApiOperation({ summary: 'Add a crew member to a movie' })
  @ApiResponse({ status: 200, description: 'Crew member added', type: Movie })
  @ApiResponse({ status: 404, description: 'Movie or person not found' })
  @ApiQuery({ name: 'id', required: true, type: String, description: 'Movie ID' })
  @ApiBody({
    description: 'Details of the crew member to add',
    required: true,
    type: Object,
    schema: {
      type: 'object',
      properties: {
        person: { type: 'string', description: 'ID of the person', example: '12345' },
        role: { type: 'string', description: 'Role of the crew member', example: 'Director' },
        department: { type: 'string', description: 'Department of the crew member', example: 'Production' },
      },
      required: ['person', 'role', 'department'],
    },
  })
  async addCrew(
    @Param('id') movieId: string,
    @Body() crewMember: { person: string; role: string; department: string },
  ) {
    return this.moviesService.addCrew(movieId, crewMember);
  }

  @Delete(':id/crew/:personId')
  @ApiOperation({ summary: 'Remove a crew member from a movie' })
  @ApiResponse({ status: 200, description: 'Crew member removed', type: Movie })
  @ApiResponse({ status: 404, description: 'Movie or crew member not found' })
  async removeCrew(@Param('id') movieId: string, @Param('personId') personId: string) {
    return this.moviesService.removeCrew(movieId, personId);
  }
}