// // auth/auth.module.ts
// import { Module } from '@nestjs/common';
// import { ConfigModule, ConfigService } from '@nestjs/config';
// import { JwtModule } from '@nestjs/jwt';
// import { PassportModule } from '@nestjs/passport';
// import { MongooseModule } from '@nestjs/mongoose';
// import { HttpModule } from '@nestjs/axios';
// import { AuthController } from './auth.controller';
// import { AuthService } from './auth.service';
// import { User, UserSchema } from '../users/schemas/user.schema';
// import { UsersModule } from '../users/users.module';
// import { JwtStrategy } from './strategies/jwt.strategy';
// import { KeycloakStrategy } from './strategies/keycloak.strategy';
// import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';

// @Module({
//   imports: [
//     ConfigModule,
//     HttpModule,
//     PassportModule.register({ defaultStrategy: 'jwt' }),
//     JwtModule.registerAsync({
//       imports: [ConfigModule],
//       inject: [ConfigService],
//       useFactory: (configService: ConfigService) => ({
//         secret: configService.get<string>('jwt.secret'),
//         signOptions: {
//           expiresIn: configService.get<string>('jwt.expiresIn'),
//         },
//       }),
//     }),
//     MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
//     UsersModule,
//   ],
//   controllers: [AuthController],
//   providers: [AuthService, JwtStrategy, JwtRefreshStrategy, KeycloakStrategy],
//   exports: [AuthService, JwtStrategy, JwtModule],
// })
// export class AuthModule {}