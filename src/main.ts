import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as helmet from 'helmet';
import { json } from 'express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import compression from 'compression';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestExpressApplication } from '@nestjs/platform-express';
import { GlobalExceptionFilter } from './helpers/custom.exception';
import * as dotenv from 'dotenv';

async function bootstrap() {
  const PORT = process.env.PORT || 0;
  const app = await NestFactory.create<NestExpressApplication>(AppModule);



  const corsOptions: CorsOptions = {
    origin: '*',
    methods: '*',
    allowedHeaders: 'Content-Type,Authorization',
    credentials: true,
  };


  // Security middlewares
  // app.use(helmet());
  // app.use(compression());



  const config = new DocumentBuilder()
    .setTitle('MovieBox API')
    .setDescription('API for MovieBox streaming platform')
    .addServer(`http://${process.env.IP_ADDRESS}:${PORT}/api/lite`, 'Local development environment')
    .setVersion('1.0')
    // .addBearerAuth()
    .addTag('Person Management')
    .addTag('Movies Management')
    .addTag('Reviews Management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/lite', app, document);

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
  app.setGlobalPrefix('api/lite');
  app.enableCors(corsOptions);
  app.use(json({ limit: '50mb' }));

  await app.listen(PORT, () => {
    console.log(`Application is running on: http://${process.env.IP_ADDRESS}:${PORT}/api/lite`);
  });

  
}
bootstrap();
