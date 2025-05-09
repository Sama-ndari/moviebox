// config/keycloak.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('keycloak', () => ({
  url: process.env.KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.KEYCLOAK_REALM || 'moviebox',
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'moviebox-api',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'client-secret',
}));