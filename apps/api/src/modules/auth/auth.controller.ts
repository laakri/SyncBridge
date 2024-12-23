import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Req,
  Headers,
  UnauthorizedException,
  Ip,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { Public } from './decorators/public.decorator';
import { RealIP } from './decorators/real-ip.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Headers('user-agent') userAgent: string,
    @RealIP() ip: string,
  ) {
    console.log('Login attempt:', {
      identifier: loginDto.identifier,
      ip,
      userAgent,
    });

    const result = await this.authService.login(loginDto, ip, userAgent);

    console.log('Login successful, device created:', {
      deviceId: result.device_id,
      userId: result.user.id,
    });

    return result;
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify email address' })
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto.token);
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification email' })
  async resendVerification(@Body() resendDto: ResendVerificationDto) {
    return this.authService.resendVerification(resendDto.email);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
  }
  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refreshToken(
    @Headers('refresh-token') refreshToken: string,
    @Headers('device-id') deviceId: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    return this.authService.refreshTokens(refreshToken, deviceId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Req() req: any) {
    return this.authService.logout(req.user.sub, req.user.device_id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.sub);
  }

  @Get('qr/generate')
  @UseGuards(JwtAuthGuard)
  async generateQRCode(@Req() req) {
    console.log('\n=== QR GENERATION ATTEMPT ===');
    console.log('Request received at:', new Date().toISOString());
    console.log('Request user:', req.user);
    console.log('Headers:', req.headers);

    try {
      console.log('Calling authService.generateLoginQR...');
      const result = await this.authService.generateLoginQR(req.user.sub);
      console.log('QR Generation result:', {
        qrId: result.qrId,
        qrCodeLength: result.qrCode.length,
      });
      return result;
    } catch (error) {
      console.error('❌ QR generation error:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  @Post('qr/authenticate')
  @UseGuards(JwtAuthGuard)
  async authenticateQR(
    @Req() req,
    @Body() data: { qrId: string; deviceInfo: { name: string } },
  ) {
    await this.authService.authenticateQRLogin(
      data.qrId,
      req.user.id,
      data.deviceInfo,
    );
    return { message: 'Device paired successfully' };
  }
}
