import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TMDbService } from './tmdb.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [TMDbService],
  exports: [TMDbService],
})
export class TMDbModule {}
