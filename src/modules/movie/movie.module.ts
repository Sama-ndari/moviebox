import { Module, forwardRef } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { TMDbModule } from '../tmdb/tmdb.module';
import { HttpModule } from '@nestjs/axios';
import { MoviesService } from './movie.service';
import { MoviesController } from './movie.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from './entities/movie.entity';
import { PersonModule } from '../person/person.module';

@Module({
    imports: [
forwardRef(() => JobsModule),TMDbModule, HttpModule,
        MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
        forwardRef(() => PersonModule)
    ],
    controllers: [MoviesController],
    providers: [MoviesService],
    exports: [MoviesService]
})
export class MovieModule {}