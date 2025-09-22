// auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ResponseService } from '../../helpers/respon-server/ResponseServer';
import { RegisterDto } from './dto/register.dto';
import { Public } from '../../common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly responseService: ResponseService,
  ) { }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'User registered successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return this.responseService.responseCreateSuccess('User registered successfully', result);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email/username and password' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Login successful' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return this.responseService.responseSuccess(result);
  }


  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtRefreshGuard)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Token refreshed successfully' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    const result = await this.authService.refreshToken(refreshTokenDto);
    return this.responseService.responseSuccess(result);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset email sent' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return this.responseService.responseSuccess({ message: 'If your email is in our system, you will receive a password reset link.' });
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Password reset successful' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    const result = await this.authService.resetPassword(resetPasswordDto);
    return this.responseService.responseSuccess(result);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'User information retrieved' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
  getProfile(@Req() req) {
    // The user is attached to the request by the JwtAuthGuard
    return this.responseService.responseSuccess({ user: req.user });
  }
}