// // auth/auth.controller.ts
// import {
//   Controller,
//   Post,
//   Body,
//   Get,
//   UseGuards,
//   Req,
//   HttpCode,
//   HttpStatus,
// } from '@nestjs/common';
// import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
// import { AuthService } from './auth.service';
// import { RegisterDto } from './dto/register.dto';
// import { LoginDto } from './dto/login.dto';
// import { RefreshTokenDto } from './dto/refresh-token.dto';
// import { ForgotPasswordDto } from './dto/forgot-password.dto';
// import { ResetPasswordDto } from './dto/reset-password.dto';
// import { KeycloakAuthGuard } from './guards/keycloak-auth.guard';
// import { Public } from '../common/decorators/public.decorator';
// import { JwtRefreshGuard } from './guards/jwt-refresh.guard';

// @ApiTags('auth')
// @Controller('auth')
// export class AuthController {
//   constructor(private readonly authService: AuthService) {}

//   @Public()
//   @Post('register')
//   @ApiOperation({ summary: 'Register a new user' })
//   @ApiResponse({ status: HttpStatus.CREATED, description: 'User registered successfully' })
//   @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid input' })
//   register(@Body() registerDto: RegisterDto) {
//     return this.authService.register(registerDto);
//   }

//   @Public()
//   @Post('login')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'Login with email/username and password' })
//   @ApiResponse({ status: HttpStatus.OK, description: 'Login successful' })
//   @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid credentials' })
//   login(@Body() loginDto: LoginDto) {
//     return this.authService.login(loginDto);
//   }

//   @Public()
//   @Get('keycloak/login')
//   @UseGuards(KeycloakAuthGuard)
//   @ApiOperation({ summary: 'Login with Keycloak' })
//   keycloakLogin() {
//     // This route redirects to Keycloak
//     return;
//   }

//   @Public()
//   @Get('keycloak/callback')
//   @UseGuards(KeycloakAuthGuard)
//   @ApiOperation({ summary: 'Keycloak callback handler' })
//   keycloakCallback(@Req() req) {
//     // The user is attached to the request by the KeycloakAuthGuard
//     return this.authService.keycloakLogin(req.user);
//   }

//   @Public()
//   @Post('refresh')
//   @HttpCode(HttpStatus.OK)
//   @UseGuards(JwtRefreshGuard)
//   @ApiOperation({ summary: 'Refresh access token' })
//   @ApiResponse({ status: HttpStatus.OK, description: 'Token refreshed successfully' })
//   @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Invalid refresh token' })
//   refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
//     return this.authService.refreshToken(refreshTokenDto);
//   }

//   @Public()
//   @Post('forgot-password')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'Request password reset' })
//   @ApiResponse({ status: HttpStatus.OK, description: 'Password reset email sent' })
//   forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
//     return this.authService.forgotPassword(forgotPasswordDto.email);
//   }

//   @Public()
//   @Post('reset-password')
//   @HttpCode(HttpStatus.OK)
//   @ApiOperation({ summary: 'Reset password with token' })
//   @ApiResponse({ status: HttpStatus.OK, description: 'Password reset successful' })
//   @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Invalid or expired token' })
//   resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
//     return this.authService.resetPassword(resetPasswordDto);
//   }

//   @Get('me')
//   @ApiBearerAuth()
//   @ApiOperation({ summary: 'Get current user' })
//   @ApiResponse({ status: HttpStatus.OK, description: 'User information retrieved' })
//   @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Not authenticated' })
//   getProfile(@Req() req) {
//     // The user is attached to the request by the JwtAuthGuard
//     return { user: req.user };
//   }
// }