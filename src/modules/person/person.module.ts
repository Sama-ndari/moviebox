import { Module, forwardRef } from '@nestjs/common';
import { JobsModule } from '../jobs/jobs.module';
import { TMDbModule } from '../tmdb/tmdb.module';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { Person, PersonSchema } from './entities/person.entity';
import { PersonService } from './person.service';
import { PersonController } from './person.controller';
import { MovieModule } from '../movie/movie.module';
import { FollowModule } from '../follow/follow.module';

@Module({
    imports: [forwardRef(() => JobsModule),TMDbModule, HttpModule,
        MongooseModule.forFeature([{ name: Person.name, schema: PersonSchema }]),
        forwardRef(() => MovieModule),
        FollowModule
    ],
    controllers: [PersonController],
    providers: [PersonService],
    exports: [PersonService],
})
export class PersonModule {}