import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
// import { AuthModule } from './auth/auth.module';
// import { UsersModule } from './user/user.module';
import { MovieModule } from './movie/movie.module';
// import { TvShowsModule } from './tv-shows/tv-shows.module';
// import { EpisodesModule } from './episodes/episodes.module';
// import { WatchlistModule } from './watchlist/watchlist.module';
// import { WatchHistoryModule } from './watch-history/watch-history.module';
// import { ReviewsModule } from './reviews/reviews.module';
// import { SearchModule } from './search/search.module';
// import { AdminModule } from './admin/admin.module';
// import { ThrottlerModule } from '@nestjs/throttler';
// import { APP_GUARD } from '@nestjs/core';
// import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
// import { RolesGuard } from './common/guards/roles.guard';
// import { UploadsModule } from './uploads/uploads.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import keycloakConfig from './config/keycloak.config';
import { PersonModule } from './person/person.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [

    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    
    MongooseModule.forRoot(process.env.MONGODB_URI || '', {
      connectionFactory: (connection) => {
        // tune your pool & keepAlive settings:
        connection.plugin((schema) => {
          schema.options.poolSize = 20;
        });
        connection.set('keepAlive', true);
        connection.set('keepAliveInitialDelay', 300000);
        return connection;
      },
    }),
    // Rate limiting
    // ThrottlerModule.forRootAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
      // useFactory: (config: ConfigService) => ({
      //   ttl: config.get('THROTTLE_TTL', 60),
      //   limit: config.get('THROTTLE_LIMIT', 100),
      // }),
    // }),
    // AuthModule,
    // UsersModule,
    MovieModule,
    PersonModule,
    // TvShowsModule,
    // EpisodesModule,
    // WatchlistModule,
    // WatchHistoryModule,
    ReviewsModule,
    // SearchModule,
    // AdminModule,
    // UploadsModule,
  ],
  providers: [
  ],
})
export class AppModule { 
  constructor() {
    console.log('MongoDB URI:', process.env.MONGODB_URI);
  }
}