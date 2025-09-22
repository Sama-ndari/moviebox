import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './config/swagger.config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as helmet from 'helmet';
import { json } from 'express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import compression from 'compression';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestExpressApplication } from '@nestjs/platform-express';
import { GlobalExceptionFilter } from './helpers/custom.exception';
import { CommonHelpers } from './helpers/helpers';
import * as dotenv from 'dotenv';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  // Initialize CommonHelpers with Redis configuration
  CommonHelpers.initialize({
    redis: {
      host: configService.get<string>('REDIS_HOST') || '127.0.0.1',
      port: configService.get<number>('REDIS_PORT') || 6379,
    },
  });

  // Now, safely initialize the Redis client
  await CommonHelpers.initializeRedisClient();

  const port = configService.get<number>('app.port') || 8001;
  const ipAddress = configService.get<string>('app.ip') || '127.0.0.1';
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/lite';



  const corsOptions: CorsOptions = {
    origin: '*',
    methods: '*',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  };


  // Security middlewares
  // app.use(helmet());
  // app.use(compression());




  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true,
      transform: true,
      // forbidNonWhitelisted: true,
      // transformOptions: {
      //   enableImplicitConversion: true,
      // },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.setGlobalPrefix(apiPrefix);
  app.enableCors(corsOptions);
  app.use(json({ limit: '50mb' }));

  if (process.env.NODE_ENV !== 'production') {
    setupSwagger(app);
  }

  await app.listen(port, ipAddress, () => {
    Logger.log(`Application is running on: http://${ipAddress}:${port}/${apiPrefix}`);
    if (process.env.NODE_ENV !== 'production') {
      Logger.log(`Swagger documentation is available at: http://${ipAddress}:${port}/${apiPrefix}/docs`);
    }
  });
}
bootstrap();
