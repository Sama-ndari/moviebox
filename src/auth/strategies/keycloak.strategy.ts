

// auth/strategies/keycloak.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    const keycloakConfig = configService.get('keycloak');
    
    super({
      authorizationURL: `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/auth`,
      tokenURL: `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`,
      clientID: keycloakConfig.clientId,
      clientSecret: keycloakConfig.clientSecret,
      callbackURL: '/api/auth/keycloak/callback',
      scope: ['openid', 'profile', 'email'],
    });
  }

  async validate(accessToken: string) {
    const keycloakConfig = this.configService.get('keycloak');
    const userInfoUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/userinfo`;
    
    const userData = await lastValueFrom(
      this.httpService
        .get(userInfoUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        .pipe(map((response) => response.data)),
    );
    
    return userData;
  }
}