import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Person } from './entities/person.entity';
import { CreatePersonDto, QueryPersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { MoviesService } from 'src/movie/movie.service';
// import { QueryPersonDto } from './dto/create-person.dto';

@Injectable()
export class PersonService {
  constructor(
    @InjectModel(Person.name) private personModel: Model<Person>,
    @Inject(forwardRef(() => MoviesService)) private readonly movieService: MoviesService,

  ) {}

  async create(createPersonDto: CreatePersonDto): Promise<Person> {
    const createdPerson = await this.personModel.create(createPersonDto);
    return createdPerson;
  }

  
  async findAll(queryDto: QueryPersonDto) {
    const { page = 1, limit = 10, role, search, sortBy = 'name', sortOrder = 'asc' } = queryDto;

    // Build query
    const query: any = {};

    // Apply filters
    if (role) {
      query.roles = role;
    }

    if (search) {
      query.$text = { $search: search };
    }

    console.log('Query filter:', JSON.stringify(query, null, 2));

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Sorting
    const sort: [string, 1 | -1][] = [[sortBy, sortOrder === 'asc' ? 1 : -1]];

    // Execute query with pagination
    try {
      const [items, totalCount] = await Promise.all([
        this.personModel
          .find(query)
          .sort(sort as [string, 1 | -1][])
          .skip(skip)
          .limit(limit)
          .populate('relatedPeople filmography')
          .exec(),
        this.personModel.countDocuments(query).exec(),
      ]);

      console.log('Found items:', items.length, 'Total count:', totalCount);

      return {
        items,
        meta: {
          totalItems: totalCount,
          itemCount: items.length,
          itemsPerPage: limit,
          totalPages: Math.ceil(totalCount / limit),
          currentPage: page,
        },
      };
    } catch (error) {
      console.error('Error executing findAll query:', error);
      throw new BadRequestException('Failed to fetch persons: ' + error.message);
    }
  }

  async findOne(id: string): Promise<Person> {
    console.log('Finding person with ID:', id);
    const person = await this.personModel.findById(id).exec();
    if (!person) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }
    return person;
  }

  async update(id: string, updatePersonDto: UpdatePersonDto): Promise<Person> {
    const updatedPerson = await this.personModel
      .findByIdAndUpdate(id, updatePersonDto, { new: true })
      .exec();
      
    if (!updatedPerson) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }
    
    return updatedPerson;
  }

  async updateProfilePath(id: string, profilePath: string): Promise<Person> {
    const updatedPerson = await this.personModel
      .findByIdAndUpdate(id, { profilePath }, { new: true })
      .exec();
      
    if (!updatedPerson) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }
    
    return updatedPerson;
  }

  async remove(id: string): Promise<{ deleted: boolean; message?: string }> {
    const result = await this.personModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }
    
    return { deleted: true, message: 'Person successfully deleted' };
  }

  async getFilmography(id: string) {
    const person = await this.personModel
      .findById(id)
      .populate('filmography')
      .exec();
      
    if (!person) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }
    
    return person.filmography;
  }

  async getRelatedPeople(id: string) {
    // First find the person
    const person = await this.personModel.findById(id).exec();
    
    if (!person) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }
    
    // If the person has explicit related people, return them
    if (person.relatedPeople && person.relatedPeople.length > 0) {
      return this.personModel
        .find({ _id: { $in: person.relatedPeople } })
        .exec();
    }
    
    // Otherwise find people who have worked on the same movies
    // This is a more complex aggregation query
    // This is a simplified version - you might want to optimize this based on your data volume
    const relatedByMovies = await this.personModel
      .find({
        _id: { $ne: id },
        filmography: { $in: person.filmography }
      })
      .limit(10)
      .sort({ popularity: -1 })
      .exec();
      
    return relatedByMovies;
  }

  async getTrending(limit: number = 10): Promise<Person[]> {
    try {
      console.log('Fetching trending people with limit:', limit);
      return await this.personModel
        .find({ isActive: true })
        .sort({ popularity: -1 })
        .limit(limit)
        .exec();
    } catch (error) {
      console.error('Error fetching trending people:', error);
      throw new BadRequestException('Failed to fetch trending people: ' + error.message);
    }
  }

  async addToFilmography(personId: string, movieId: string) {
    // First verify the movie exists
    const movie = await this.movieService.findOne(movieId);
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }
  
    // Use updateOne with $addToSet to avoid duplicates
    const updateResult = await this.personModel.updateOne(
      { _id: personId, filmography: { $ne: movieId } }, // Check person exists and movie not already in array
      { $push: { filmography: movieId } }
    ).exec();
  
    if (updateResult.matchedCount === 0) {
      // Either person not found or movie already in filmography
      // Let's determine which one
      const person = await this.personModel.findById(personId).exec();
      if (!person) {
        throw new NotFoundException(`Person with ID ${personId} not found`);
      } else {
        throw new BadRequestException('Movie already exists in filmography');
      }
    }
  
    // Return the updated person
    return this.personModel.findById(personId).exec();
  }

  async removeFromFilmography(personId: string, movieId: string) {
    const person = await this.personModel.findById(personId).exec();
    if (!person) {
      throw new NotFoundException(`Person with ID ${personId} not found`);
    }
  
    // Check if movie exists in database
    const movie = await this.movieService.findOne(movieId);
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${movieId} not found`);
    }
  
   // Check if movie is in filmography
   if (!person.filmography.some(film => film.toString() === movieId)) {
    throw new BadRequestException(`Movie with ID ${movieId} not found in filmography`);
  }
  
    // Remove movie from filmography
    person.filmography = person.filmography.filter(film => film.toString() !== movieId);
    await person.save();
    return person;
  }
}