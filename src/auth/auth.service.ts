// // auth/auth.service.ts
// import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { ConfigService } from '@nestjs/config';
// import { HttpService } from '@nestjs/axios';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { User, UserRole } from '../users/schemas/user.schema';
// import { UsersService } from '../users/users.service';
// import { RegisterDto } from './dto/register.dto';
// import { LoginDto } from './dto/login.dto';
// import { RefreshTokenDto } from './dto/refresh-token.dto';
// import { ResetPasswordDto } from './dto/reset-password.dto';
// import { JwtPayload } from './interfaces/jwt-payload.interface';
// import { lastValueFrom } from 'rxjs';
// import { catchError, map } from 'rxjs/operators';
// import * as bcrypt from 'bcrypt';

// @Injectable()
// export class AuthService {
//   private readonly logger = new Logger(AuthService.name);

//   constructor(
//     @InjectModel(User.name) private userModel: Model<User>,
//     private jwtService: JwtService,
//     private configService: ConfigService,
//     private usersService: UsersService,
//     private httpService: HttpService,
//   ) {}

//   /**
//    * Register a new user
//    */
//   async register(registerDto: RegisterDto) {
//     const { email, username } = registerDto;

//     // Check if user already exists
//     const existingUser = await this.userModel.findOne({
//       $or: [{ email }, { username }],
//     });

//     if (existingUser) {
//       if (existingUser.email === email) {
//         throw new BadRequestException('Email already in use');
//       } else {
//         throw new BadRequestException('Username already in use');
//       }
//     }

//     // Create user in Keycloak
//     try {
//       await this.createKeycloakUser(registerDto);
//     } catch (error) {
//       this.logger.error(`Failed to create Keycloak user: ${error.message}`);
//       throw new BadRequestException('Failed to register user with identity provider');
//     }

//     // Create local user
//     const createdUser = await this.usersService.create({
//       ...registerDto,
//       role: UserRole.USER,
//     });

//     // Generate tokens
//     const { accessToken, refreshToken } = await this.generateTokens(createdUser);

//     return {
//       user: this.usersService.sanitizeUser(createdUser),
//       accessToken,
//       refreshToken,
//     };
//   }

//   /**
//    * Login a user with username/email and password
//    */
//   async login(loginDto: LoginDto) {
//     const { username, email, password } = loginDto;

//     // Find user by username or email
//     const user = await this.userModel.findOne({
//       $or: [{ username }, { email }],
//     });

//     if (!user || !(await user.comparePassword(password))) {
//       throw new UnauthorizedException('Invalid credentials');
//     }

//     if (!user.isActive) {
//       throw new UnauthorizedException('User account is deactivated');
//     }

//     // Update last login
//     user.lastLogin = new Date();
//     await user.save();

//     // Generate tokens
//     const { accessToken, refreshToken } = await this.generateTokens(user);

//     return {
//       user: this.usersService.sanitizeUser(user),
//       accessToken,
//       refreshToken,
//     };
//   }

//   /**
//    * Authenticate with Keycloak
//    */
//   async keycloakLogin(keycloakUser: any) {
//     let user = await this.userModel.findOne({ email: keycloakUser.email });

//     // If user doesn't exist, create one
//     if (!user) {
//       user = await this.usersService.create({
//         username: keycloakUser.preferred_username || keycloakUser.email.split('@')[0],
//         email: keycloakUser.email,
//         password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10), // Random password
//         role: UserRole.USER,
//         profileImageUrl: keycloakUser.picture,
//       });
//     }

//     // Update last login
//     user.lastLogin = new Date();
//     await user.save();

//     // Generate tokens
//     const { accessToken, refreshToken } = await this.generateTokens(user);

//     return {
//       user: this.usersService.sanitizeUser(user),
//       accessToken,
//       refreshToken,
//     };
//   }

//   /**
//    * Refresh access token using refresh token
//    */
//   async refreshToken(refreshTokenDto: RefreshTokenDto) {
//     const { refreshToken } = refreshTokenDto;
    
//     try {
//       // Verify refresh token
//       const decoded = this.jwtService.verify(refreshToken, {
//         secret: this.configService.get<string>('jwt.secret'),
//       });
      
//       const user = await this.userModel.findById(decoded.sub);
      
//       if (!user || !user.isActive) {
//         throw new UnauthorizedException('Invalid token');
//       }
      
//       // Generate new tokens
//       const tokens = await this.generateTokens(user);
      
//       return tokens;
//     } catch (error) {
//       throw new UnauthorizedException('Invalid or expired refresh token');
//     }
//   }

//   /**
//    * Validate user by JWT payload
//    */
//   async validateUser(payload: JwtPayload): Promise<User> {
//     const user = await this.userModel.findById(payload.sub);
    
//     if (!user || !user.isActive) {
//       throw new UnauthorizedException('User not found or inactive');
//     }
    
//     return user;
//   }

//   /**
//    * Initiate password reset
//    */
//   async forgotPassword(email: string) {
//     const user = await this.userModel.findOne({ email });
    
//     if (!user) {
//       // Return success even if user doesn't exist for security reasons
//       return { success: true, message: 'Password reset instructions sent if email exists' };
//     }

//     // In a real app, you would:
//     // 1. Generate a reset token
//     // 2. Send an email with the reset link
//     // 3. Save the token in the database with an expiry

//     // For this example, we'll just return success
//     return { success: true, message: 'Password reset instructions sent if email exists' };
//   }

//   /**
//    * Reset password with token
//    */
//   async resetPassword(resetPasswordDto: ResetPasswordDto) {
//     const { token, password } = resetPasswordDto;
    
//     // In a real app, you would:
//     // 1. Verify the token
//     // 2. Find the user associated with the token
//     // 3. Update the password
//     // 4. Invalidate the token
    
//     // For this example, we'll just return success
//     return { success: true, message: 'Password reset successfully' };
//   }

//   /**
//    * Generate JWT access and refresh tokens
//    */
//   private async generateTokens(user: User) {
//     const payload: JwtPayload = {
//       sub: user._id.toString(),
//       username: user.username,
//       email: user.email,
//       role: user.role,
//     };
    
//     const accessToken = this.jwtService.sign(payload, {
//       secret: this.configService.get<string>('jwt.secret'),
//       expiresIn: this.configService.get<string>('jwt.expiresIn'),
//     });
    
//     const refreshToken = this.jwtService.sign(payload, {
//       secret: this.configService.get<string>('jwt.secret'),
//       expiresIn: this.configService.get<string>('jwt.refreshExpiresIn'),
//     });
    
//     return {
//       accessToken,
//       refreshToken,
//     };
//   }

//   /**
//    * Create a user in Keycloak
//    */
//   private async createKeycloakUser(userData: RegisterDto) {
//     const keycloakConfig = this.configService.get('keycloak');
//     const tokenEndpoint = `${keycloakConfig.url}/realms/master/protocol/openid-connect/token`;
//     const userEndpoint = `${keycloakConfig.url}/admin/realms/${keycloakConfig.realm}/users`;

//     // Get admin token
//     const tokenResponse = await lastValueFrom(
//       this.httpService
//         .post(
//           tokenEndpoint,
//           new URLSearchParams({
//             grant_type: 'client_credentials',
//             client_id: keycloakConfig.clientId,
//             client_secret: keycloakConfig.clientSecret,
//           }),
//           {
//             headers: {
//               'Content-Type': 'application/x-www-form-urlencoded',
//             },
//           },
//         )
//         .pipe(
//           map((response) => response.data),
//           catchError((error) => {
//             this.logger.error(`Keycloak token error: ${error.message}`);
//             throw new BadRequestException('Failed to authenticate with identity provider');
//           }),
//         ),
//     );

//     // Create user
//     await lastValueFrom(
//       this.httpService
//         .post(
//           userEndpoint,
//           {
//             username: userData.username,
//             email: userData.email,
//             enabled: true,
//             emailVerified: false,
//             credentials: [
//               {
//                 type: 'password',
//                 value: userData.password,
//                 temporary: false,
//               },
//             ],
//           },
//           {
//             headers: {
//               Authorization: `Bearer ${tokenResponse.access_token}`,
//               'Content-Type': 'application/json',
//             },
//           },
//         )
//         .pipe(
//           catchError((error) => {
//             this.logger.error(`Keycloak user creation error: ${error.message}`);
//             throw new BadRequestException('Failed to create user with identity provider');
//           }),
//         ),
//     );
//   }
// }