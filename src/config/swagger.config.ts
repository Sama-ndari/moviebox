// config/swagger.config.ts
import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

export function setupSwagger(app: INestApplication) {
  const configService = app.get(ConfigService);
  const appName = configService.get<string>('app.name');
  const apiPrefix = configService.get<string>('app.apiPrefix');
  
  const options = new DocumentBuilder()
    .setTitle(`${appName} - API Documentation`)
    .setDescription('API documentation for MovieBox streaming platform')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User operations')
    .addTag('movies', 'Movie operations')
    .addTag('tv-shows', 'TV Show operations')
    .addTag('episodes', 'Episode operations')
    .addTag('watchlists', 'Watchlist operations')
    .addTag('watch-history', 'Watch history operations')
    .addTag('reviews', 'Review operations')
    .addTag('search', 'Search operations')
    .addTag('admin', 'Admin operations')
    .addTag('uploads', 'File upload operations')
    .build();
  
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
}
