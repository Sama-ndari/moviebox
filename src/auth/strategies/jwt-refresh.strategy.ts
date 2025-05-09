// // auth/strategies/jwt-refresh.strategy.ts
// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { Request } from 'express';
// import { ConfigService } from '@nestjs/config';
// import { AuthService } from '../auth.service';
// import { JwtPayload } from '../interfaces/jwt-payload.interface';

// @Injectable()
// export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
//   constructor(
//     private configService: ConfigService,
//     private authService: AuthService,
//   ) {
//     super({
//       jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
//       secretOrKey: process.env.JWT_SECRET,
//       passReqToCallback: true,
//     });
//   }

//   async validate(req: Request, payload: JwtPayload) {
//     const refreshToken = req.body.refreshToken;
    
//     if (!refreshToken) {
//       throw new UnauthorizedException();
//     }
    
//     try {
//       const user = await this.authService.validateUser(payload);
//       return user;
//     } catch (error) {
//       throw new UnauthorizedException();
//     }
//   }
// }