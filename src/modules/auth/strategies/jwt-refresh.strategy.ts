import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      secretOrKey: configService.get<string>('JWT_SECRET') || '',
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.body.refreshToken;
    const user = await this.authService.validateUser(payload);

    if (!user) {
      throw new UnauthorizedException();
    }

    // You might want to add logic here to check if the refresh token is valid
    // (e.g., if it's been revoked)

    return { ...user, refreshToken };
  }
}
