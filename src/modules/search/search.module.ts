import { Module } from '@nestjs/common';
import { TMDbModule } from '../tmdb/tmdb.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from '../movie/entities/movie.entity';
import { TvShow, TvShowSchema } from '../tv-show/entities/tv-show.entity';
import { Person, PersonSchema } from '../person/entities/person.entity';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { MovieModule } from '../movie/movie.module';
import { TvShowModule } from '../tv-show/tv-show.module';
import { PersonModule } from '../person/person.module';

@Module({
  imports: [
    TMDbModule,
    MovieModule,
    TvShowModule,
    PersonModule,
    MongooseModule.forFeature([
      { name: Movie.name, schema: MovieSchema },
      { name: TvShow.name, schema: TvShowSchema },
      { name: Person.name, schema: PersonSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService]
})
export class SearchModule {}