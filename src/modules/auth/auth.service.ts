// auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { CommonHelpers } from '../../helpers/helpers';
import { JwtService } from '@nestjs/jwt';
import { Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../user/entities/user.entity';
import { IUser } from '../user/interfaces/user.interface';
import { UserService } from './../user/user.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { lastValueFrom } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NotificationService } from '../notification/notification.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UserService,
    private notificationService: NotificationService,
      ) {}


  async register(registerDto: RegisterDto) {
    const { email, username } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new BadRequestException('Email already in use');
      } else {
        throw new BadRequestException('Username already in use');
      }
    }

    
    try {
      this.logger.log(`Registering user: ${username}`);
      const createdUser = await this.usersService.create({
        ...registerDto,
        role: UserRole.USER,
      });

      const { accessToken, refreshToken } = await this.generateTokens(createdUser);
      this.logger.log(`User ${username} registered successfully`);

      return {
        user: this.usersService.sanitizeUser(createdUser),
        accessToken,
        refreshToken,
      };
    } catch (error) {
        this.logger.error(`Registration failed for user: ${username}`, error.stack);
        if (error instanceof BadRequestException) {
            throw error;
        }
        throw new InternalServerErrorException('An unexpected error occurred during registration.');
    }
  }

  async login(loginDto: LoginDto) {
    const { username, email, password } = loginDto;

    // Find user by username or email
    const user = await this.userModel.findOne({
      $or: [{ username }, { email }],
    }) as IUser;

    if (!user || !(await user.comparePassword(password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    // Update last login
    try {
      user.lastLogin = new Date();
      await user.save();
    } catch (error) {
      this.logger.error(`Failed to update lastLogin for user ${user.username}`, error.stack);
      throw new InternalServerErrorException('Failed to update user session.');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    this.logger.log(`User ${user.username} logged in successfully`);
    return {
      user: this.usersService.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }


  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    const { refreshToken } = refreshTokenDto;
    
    try {
      // Verify refresh token
      const decoded = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      
      const user = await this.userModel.findById(decoded.sub);
      
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid token');
      }
      
      // Generate new tokens
      const tokens = await this.generateTokens(user);
      
      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateUser(payload: JwtPayload): Promise<UserDocument> {
    const user = await this.userModel.findById(payload.sub);
    
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }
    
    return user;
  }

  async forgotPassword(email: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      this.logger.warn(`Password reset attempted for non-existent email: ${email}`);
      return; // Do not throw an error to prevent user enumeration
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await user.save();

    const resetUrl = `${this.configService.get('APP_URL')}/reset-password?token=${resetToken}`;

    try {
      await this.notificationService.sendPasswordResetEmail(user.email, resetUrl);
      this.logger.log(`Password reset email sent to ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${user.email}`, error.stack);
      // Even if email fails, we don't want to leak information. The user receives the same success message.
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.userModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new BadRequestException('Password reset token is invalid or has expired.');
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    this.logger.log(`Password for user ${user.email} has been reset successfully.`);
    return { message: 'Password has been reset successfully.' };
  }

  private async generateTokens(user: UserDocument) {
    const payload: JwtPayload = {
      sub: (user._id as Types.ObjectId).toString(),
      username: user.username,
      email: user.email,
      role: user.role as UserRole,
    };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN'),
    });
    
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });
    
    return {
      accessToken,
      refreshToken,
    };
  }

  }