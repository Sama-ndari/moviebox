import { forwardRef, Module } from '@nestjs/common';
import { MoviesService } from './movie.service';
import { MoviesController } from './movie.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from './entities/movie.entity';
import { PersonModule } from 'src/person/person.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Movie.name, schema: MovieSchema }]),
        forwardRef(() => PersonModule)
    ],
    controllers: [MoviesController],
    providers: [MoviesService],
    exports: [MoviesService]
})
export class MovieModule {}