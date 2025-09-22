// config/app.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  env: process.env.NODE_ENV || 'development',
  name: process.env.APP_NAME || 'MovieBox API',
  port: parseInt(process.env.PORT || '8001', 10),
  ip: process.env.IP_ADDRESS || '127.0.0.1',
  apiPrefix: process.env.API_PREFIX || 'api',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  tmdbApiKey: process.env.TMDB_API_KEY,
}));