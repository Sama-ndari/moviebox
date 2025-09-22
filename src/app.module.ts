import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { WatchlistModule } from './modules/watchlist/watchlist.module';
import { FollowModule } from './modules/follow/follow.module';
import { WatchHistoryModule } from './modules/watch-history/watch-history.module';
import { SearchModule } from './modules/search/search.module';
import { TvShowModule } from './modules/tv-show/tv-show.module';
import { SeasonModule } from './modules/season/season.module';
import { EpisodeModule } from './modules/episode/episode.module';
import { NotificationModule } from './modules/notification/notification.module';
import { MovieModule } from './modules/movie/movie.module';
import { PersonModule } from './modules/person/person.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { RecommendationModule } from './modules/recommendation/recommendation.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UserModule } from './modules/user/user.module';
import { ResponseServerModule } from './helpers/respon-server/ResponseServer.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { JobsModule } from './modules/jobs/jobs.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import keycloakConfig from './config/keycloak.config';
import queueConfig from './config/queue.config';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [

    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, keycloakConfig, queueConfig],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get('queue.redis.host'),
          port: configService.get('queue.redis.port'),
        },
      }),
      inject: [ConfigService],
    }),
    ResponseServerModule,
    
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
    HttpModule,
    AuthModule,
    UserModule,
    FollowModule,
    MovieModule,
    PersonModule,
    TvShowModule,
    SeasonModule,
    EpisodeModule,
    WatchlistModule,
    WatchHistoryModule,
    ReviewsModule,
    SearchModule,
    NotificationModule,
    RecommendationModule,
    UploadsModule,
    JobsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {
}