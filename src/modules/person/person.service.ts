import { forwardRef, Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Person } from './entities/person.entity';
import { CreatePersonDto, QueryPersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { MoviesService } from '../movie/movie.service';
import { TMDbService } from '../tmdb/tmdb.service';
import { HttpService } from '@nestjs/axios';
import * as fs from 'fs';
import * as path from 'path';
import { CreatePersonFromTMDbDto } from './dto/create-from-tmdb.dto';
import { PersonRole } from './entities/enumerate.entity';
import { CommonHelpers } from '../../helpers/helpers';
import { ResponseService } from '../../helpers/respon-server/ResponseServer';
import { JobsService } from '../jobs/jobs.service';

@Injectable()
export class PersonService {
    constructor(
        @InjectModel(Person.name) private personModel: Model<Person>,
        @Inject(forwardRef(() => MoviesService)) private moviesService: MoviesService,
        private readonly tmdbService: TMDbService,
        private readonly httpService: HttpService,
        private readonly responseService: ResponseService,
        private readonly jobsService: JobsService,
    ) { }

    async create(createPersonDto: CreatePersonDto) {
        try {
            const createdPerson = await CommonHelpers.retry(() => this.personModel.create(createPersonDto));
            await CommonHelpers.invalidateCacheByPattern('people:*');
            return this.responseService.responseCreateSuccess('Person created successfully', createdPerson);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async createFromTMDb(dto: CreatePersonFromTMDbDto) {
        const { tmdbId, name } = dto;
        if (!tmdbId && !name) {
            throw new BadRequestException('Either tmdbId or name must be provided.');
        }

        let personId: number;

        if (tmdbId) {
            personId = tmdbId;
        } else if (name) {
            const searchResults = await this.tmdbService.searchPerson(name);
            if (!searchResults.results || searchResults.results.length === 0) {
                throw new NotFoundException(`Person with name '${name}' not found on TMDb.`);
            }
            personId = searchResults.results[0].id;
        } else {
            throw new BadRequestException('Either tmdbId or name must be provided.');
        }

        const existingPerson = await this.personModel.findOne({ tmdbId: personId }).exec();
        if (existingPerson) {
            return this.responseService.responseSuccess(existingPerson);
        }

        const personDetails = await this.tmdbService.getPersonDetails(personId!);

        if (personDetails.profile_path) {
            const imageName = `${personId}_${path.basename(personDetails.profile_path)}`;
            await this.jobsService.addImageDownloadJob({
                imageUrl: `https://image.tmdb.org/t/p/original${personDetails.profile_path}`,
                tmdbId: personId,
                type: 'profile',
                imagePath: `/profiles/${imageName}`,
            });
        }

        const createPersonDto: CreatePersonDto = {
            name: personDetails.name,
            biography: personDetails.biography,
            birthDate: personDetails.birthday ? new Date(personDetails.birthday) : undefined,
            deathDate: personDetails.deathday ? new Date(personDetails.deathday) : undefined,
            birthPlace: personDetails.place_of_birth,
            profilePath: '', // Will be updated by the background job
            roles: [PersonRole.ACTOR], // Defaulting to Actor
            tmdbId: personDetails.id,
        };

        return this.create(createPersonDto);
    }

    async findAll(queryDto: QueryPersonDto) {
        const { page = 1, limit = 10 } = queryDto;
        const cacheKey = `people:popular:${page}:${limit}`;
        const fetchFn = async () => {
            const tmdbPeople = await this.tmdbService.getPopularPeople(page);
            const tmdbIds = tmdbPeople.results.map((person) => person.id);

            const localPeople = await this.personModel.find({ tmdbId: { $in: tmdbIds } }).exec();
            const localPeopleMap = new Map(localPeople.map((person) => [person.tmdbId, person]));

            const mergedPeople = tmdbPeople.results.map((tmdbPerson) => {
                const localPerson = localPeopleMap.get(tmdbPerson.id);
                return {
                    ...tmdbPerson,
                    ...(localPerson ? localPerson.toObject() : {}),
                };
            });

            return {
                items: mergedPeople.slice(0, limit),
                meta: {
                    totalItems: tmdbPeople.total_results,
                    itemCount: mergedPeople.length,
                    itemsPerPage: limit,
                    totalPages: tmdbPeople.total_pages,
                    currentPage: page,
                }
            };
        };

        try {
            const data = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn, 3600); // Cache for 1 hour
            return this.responseService.responseSuccess(data);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async findOne(id: string) {
        const cacheKey = `person:${id}`;
        const fetchFn = async () => {
            const person = await this.personModel.findById(id).populate('relatedPeople filmography followers').exec();
            if (!person) throw new NotFoundException(`Person with ID ${id} not found`);
            return person;
        };

        try {
            const person = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
            return this.responseService.responseSuccess(person);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async update(id: string, updatePersonDto: UpdatePersonDto) {
        try {
            const updatedPerson = await CommonHelpers.retry(() => this.personModel.findByIdAndUpdate(id, updatePersonDto, { new: true }).exec());
            if (!updatedPerson) throw new NotFoundException(`Person with ID ${id} not found`);
            await CommonHelpers.invalidateCache([`person:${id}`]);
            await CommonHelpers.invalidateCacheByPattern('people:*');
            return this.responseService.responseUpdateSuccess('Person updated successfully', updatedPerson);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async remove(id: string) {
        try {
            const result = await CommonHelpers.retry(() => this.personModel.findByIdAndDelete(id).exec());
            if (!result) throw new NotFoundException(`Person with ID ${id} not found`);
            await CommonHelpers.invalidateCache([`person:${id}`]);
            await CommonHelpers.invalidateCacheByPattern('people:*');
            return this.responseService.responseDeleteSuccess('Person deleted successfully', null);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async getFilmography(id: string) {
        const cacheKey = `person:${id}:filmography`;
        const fetchFn = async () => {
            const person = await this.personModel.findById(id).populate('filmography').exec();
            if (!person) throw new NotFoundException(`Person with ID ${id} not found`);
            return person.filmography;
        };

        try {
            const filmography = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
            return this.responseService.responseSuccess(filmography);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async getRelatedPeople(id: string) {
        const cacheKey = `person:${id}:related`;
        const fetchFn = async () => {
            const person = await this.personModel.findById(id).exec();
            if (!person) throw new NotFoundException(`Person with ID ${id} not found`);

            if (person.relatedPeople && person.relatedPeople.length > 0) {
                return this.personModel.find({ _id: { $in: person.relatedPeople } }).exec();
            }

            return this.personModel.find({ _id: { $ne: id }, filmography: { $in: person.filmography } }).limit(10).sort({ popularity: -1 }).exec();
        };

        try {
            const relatedPeople = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn);
            return this.responseService.responseSuccess(relatedPeople);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async getTrending(limit: number = 10) {
        const cacheKey = `people:trending:${limit}`;
        const fetchFn = () => this.personModel.find({ isActive: true }).sort({ popularity: -1 }).limit(limit).exec();

        try {
            const people = await CommonHelpers.cacheOrFetch(cacheKey, fetchFn, 3600);
            return this.responseService.responseSuccess(people);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async addToFilmography(personId: string, movieId: string) {
        try {
            const movieResponse = await this.moviesService.findOne(movieId);
            if (movieResponse.statusCode !== 200) throw new NotFoundException(`Movie with ID ${movieId} not found`);

            const updateResult = await CommonHelpers.retry(() => this.personModel.updateOne({ _id: personId, filmography: { $ne: movieId } }, { $push: { filmography: movieId } }).exec());

            if (updateResult.matchedCount === 0) {
                const person = await this.personModel.findById(personId).exec();
                if (!person) throw new NotFoundException(`Person with ID ${personId} not found`);
                throw new BadRequestException('Movie already exists in filmography');
            }

            await CommonHelpers.invalidateCache([`person:${personId}`]);
            await CommonHelpers.invalidateCacheByPattern('people:*');
            const updatedPerson = await this.findOne(personId);
            return this.responseService.responseUpdateSuccess('Movie added to filmography successfully', updatedPerson?.data);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async removeFromFilmography(personId: string, movieId: string) {
        try {
            const person = await this.personModel.findById(personId).exec();
            if (!person) throw new NotFoundException(`Person with ID ${personId} not found`);

            const movieResponse = await this.moviesService.findOne(movieId);
            if (movieResponse.statusCode !== 200) throw new NotFoundException(`Movie with ID ${movieId} not found`);

            if (!person.filmography.some(film => film.toString() === movieId)) {
                throw new BadRequestException(`Movie with ID ${movieId} not found in filmography`);
            }

            person.filmography = person.filmography.filter(film => film.toString() !== movieId);
            const savedPerson = await CommonHelpers.retry(() => person.save());

            await CommonHelpers.invalidateCache([`person:${personId}`]);
            await CommonHelpers.invalidateCacheByPattern('people:*');
            return this.responseService.responseUpdateSuccess('Movie removed from filmography successfully', savedPerson);
        } catch (error) {
            return this.responseService.responseError(error.message);
        }
    }

    async updateByTmdbId(tmdbId: number, updateDto: Partial<Person>) {
        const person = await this.personModel.findOneAndUpdate({ tmdbId }, { $set: updateDto }, { new: true }).exec();
        if (person) {
            await CommonHelpers.invalidateCache([`person:${person._id}`]);
        }
        return person;
    }
}