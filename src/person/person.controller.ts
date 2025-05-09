import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    NotFoundException,
    HttpStatus,
    UseGuards,
    Patch,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
  import { PersonService } from './person.service';
  import { CreatePersonDto, QueryPersonDto } from './dto/create-person.dto';
  import { UpdatePersonDto } from './dto/update-person.dto';
  import { PersonRole } from './entities/enumerate.entity';
//   import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
//   import { RolesGuard } from '../auth/guards/roles.guard';
//   import { Roles } from '../auth/decorators/roles.decorator';
  import { diskStorage } from 'multer';
  import { extname } from 'path';
  import { v4 as uuidv4 } from 'uuid';
import { Person } from './entities/person.entity';
  
  @ApiTags('Person Management')
  @Controller('person')
  export class PersonController {
    constructor(private readonly personService: PersonService) {}
  
    @Post()
    @ApiOperation({ summary: 'Create a new person' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Person has been successfully created.' })
    @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input data.' })
    @ApiBody({ type: CreatePersonDto })
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles('admin')
    async create(@Body() createPersonDto: CreatePersonDto) {
      console.log("Creating a Person");
      
      return this.personService.create(createPersonDto);
    }
  
    // @ApiOperation({ summary: 'Upload person profile image' })
    // @ApiParam({ name: 'id', description: 'Person ID' })
    // @ApiResponse({ status: HttpStatus.OK, description: 'Profile image has been uploaded.' })
    // // @UseGuards(JwtAuthGuard, RolesGuard)
    // // @Roles('admin')
    // @Post(':id/upload-profile')
    // @UseInterceptors(
    //   FileInterceptor('profile', {
    //     storage: diskStorage({
    //       destination: './uploads/profiles',
    //       filename: (req, file, cb) => {
    //         const fileExtName = extname(file.originalname);
    //         const newFilename = uuidv4() + fileExtName;
    //         cb(null, newFilename);
    //       },
    //     }),
    //     fileFilter: (req, file, cb) => {
    //       if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    //         return cb(new BadRequestException('Only image files are allowed!'), false);
    //       }
    //       cb(null, true);
    //     },
    //     limits: {
    //       fileSize: 5 * 1024 * 1024, // 5MB limit
    //     },
    //   }),
    // )
    // async uploadProfile(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    //   if (!file) {
    //     throw new BadRequestException('No file uploaded');
    //   }
      
    //   const profilePath = `profiles/${file.filename}`;
    //   return this.personService.updateProfilePath(id, profilePath);
    // }
  
    @Get()
  @ApiOperation({ summary: 'Get all people with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starting from 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page', example: 10 })
  @ApiQuery({ name: 'role', required: false, enum: PersonRole, description: 'Filter by role', example: PersonRole.ACTOR })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for name or biography', example: 'John' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by (e.g., name, popularity)', example: 'name' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order', example: 'asc' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of persons with pagination metadata', type: [Person] })
  async findAll(@Query() queryDto: QueryPersonDto) {
    console.log('Received GET /api/lite/person with query:', JSON.stringify(queryDto, null, 2));
    return this.personService.findAll({
      page: queryDto.page ? +queryDto.page : 1,
      limit: queryDto.limit ? +queryDto.limit : 10,
      role: queryDto.role,
      search: queryDto.search,
      sortBy: queryDto.sortBy || 'name',
      sortOrder: queryDto.sortOrder || 'asc',
    });
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending people' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of people to return' })
  async getTrending(@Query('limit') limit: number = 10) {
    return this.personService.getTrending(+limit);
  }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get person by ID' })
    @ApiParam({ name: 'id', description: 'Person ID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Person found.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Person not found.' })
    async findOne(@Param('id') id: string) {
      const person = await this.personService.findOne(id);
      if (!person) {
        throw new NotFoundException(`Person with ID ${id} not found`);
      }
      return person;
    }

    @Get('related/:id')
    @ApiOperation({ summary: 'Get similar/related people' })
    @ApiParam({ name: 'id', description: 'Person ID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Related people retrieved.' })
    async getRelatedPeople(@Param('id') id: string) {
      console.log('Received GET /api/lite/person/:id/related with id:', id);
      return this.personService.getRelatedPeople(id);
    }

   
  
    @Get(':id/filmography')
    @ApiOperation({ summary: 'Get person filmography' })
    @ApiParam({ name: 'id', description: 'Person ID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Filmography retrieved.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Person not found.' })
    async getFilmography(@Param('id') id: string) {
      return this.personService.getFilmography(id);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update person by ID' })
    @ApiParam({ name: 'id', description: 'Person ID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Person has been updated.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Person not found.' })
    @ApiBody({ type: UpdatePersonDto })
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles('admin')
    async update(@Param('id') id: string, @Body() updatePersonDto: UpdatePersonDto) {
      return this.personService.update(id, updatePersonDto);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Delete person by ID' })
    @ApiParam({ name: 'id', description: 'Person ID' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Person has been deleted.' })
    @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Person not found.' })
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles('admin')
    async remove(@Param('id') id: string) {
      return this.personService.remove(id);
    }
  
    @Post(':id/filmography/:movieId')
    @ApiOperation({ summary: 'Add movie to person filmography' })
    @ApiParam({ name: 'id', description: 'Person ID' })
    @ApiParam({ name: 'movieId', description: 'Movie ID' })
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles('admin')
    async addToFilmography(@Param('id') id: string, @Param('movieId') movieId: string) {
      return this.personService.addToFilmography(id, movieId);
    }
  
    @Delete(':id/filmography/:movieId')
    @ApiOperation({ summary: 'Remove movie from person filmography' })
    @ApiParam({ name: 'id', description: 'Person ID' })
    @ApiParam({ name: 'movieId', description: 'Movie ID' })
    // @UseGuards(JwtAuthGuard, RolesGuard)
    // @Roles('admin')
    async removeFromFilmography(@Param('id') id: string, @Param('movieId') movieId: string) {
      return this.personService.removeFromFilmography(id, movieId);
    }

  }