import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';
import { Redis } from 'ioredis';

import { User } from '../../entities/user.entity';
import { Device, DeviceType, OSType } from '../../entities/device.entity';
import { DeviceAuthentication } from '../../entities/device-auth.entity';
import { EmailService } from './email.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { SecurityEventService } from './security/security-event.service';
import { parseUserAgent } from '../../utils/user-agent.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @InjectRepository(DeviceAuthentication)
    private deviceAuthRepository: Repository<DeviceAuthentication>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private securityEventService: SecurityEventService,
    private dataSource: DataSource,
    private redis: Redis,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ message: string }> {
    // Start a transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if user exists
      const existingUser = await queryRunner.manager.findOne(User, {
        where: [
          { email: registerDto.email },
          { username: registerDto.username },
        ],
      });

      if (existingUser) {
        throw new ConflictException('User already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(registerDto.password, 12);
      const verificationToken = uuidv4();

      // Create user
      const user = queryRunner.manager.create(User, {
        email: registerDto.email,
        username: registerDto.username,
        full_name: registerDto.fullName,
        password_hash: hashedPassword,
        email_verified: false,
        verification_token: verificationToken,
      });

      // Save user
      await queryRunner.manager.save(user);

      // Send verification email
      await this.emailService.sendVerificationEmail(user, verificationToken);

      // If everything succeeds, commit the transaction
      await queryRunner.commitTransaction();

      return { message: 'Registration successful. Please verify your email.' };
    } catch (error) {
      // If anything fails, rollback the transaction
      await queryRunner.rollbackTransaction();

      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Registration failed. Please try again.',
      );
    } finally {
      // Release the query runner
      await queryRunner.release();
    }
  }

  async login(
    loginDto: LoginDto,
    ipAddress: string,
    userAgent: string,
  ): Promise<any> {
    // Find user by email or username
    const user = await this.userRepository.findOne({
      where: [
        { email: loginDto.identifier },
        { username: loginDto.identifier },
      ],
    });

    if (
      !user ||
      !(await bcrypt.compare(loginDto.password, user.password_hash))
    ) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.email_verified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    // Create or update device
    const device = await this.handleDeviceLogin(
      user,
      loginDto.deviceName,
      ipAddress,
      userAgent,
    );

    // Generate tokens
    const tokens = await this.generateTokens(user, device);

    // Log security event
    await this.securityEventService.logLoginEvent(user, device, true);
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      device_id: device.device_id,
      user: {
        id: user.user_id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
      },
    };
  }

  private async handleDeviceLogin(
    user: User,
    deviceName: string,
    ipAddress: string,
    userAgent: string,
  ): Promise<Device> {
    const deviceInfo = parseUserAgent(userAgent);

    let device = await this.deviceRepository.findOne({
      where: {
        user_id: user.user_id,
        device_token: deviceInfo.fingerprint,
      },
    });

    if (!device) {
      // Create new device with explicit device_id
      device = this.deviceRepository.create({
        device_id: uuidv4(),
        user_id: user.user_id,
        device_name: deviceName || deviceInfo.name,
        device_type: deviceInfo.type as DeviceType,
        os_type: deviceInfo.os as OSType,
        browser_type: deviceInfo.browser,
        last_ip_address: ipAddress,
        device_token: deviceInfo.fingerprint,
        device_settings: {},
        is_active: true,
        sync_enabled: true,
        auto_sync: true,
        sync_interval: 300,
      });

      await this.deviceRepository.save(device);
      await this.emailService.sendNewDeviceNotification(user, device);
      await this.securityEventService.logDevicePaired(user, device, ipAddress);
    } else {
      // Update existing device and reactivate it
      device.last_active = new Date();
      device.last_ip_address = ipAddress;
      device.is_active = true;
      device = await this.deviceRepository.save(device);
    }

    return device;
  }

  private async generateTokens(user: User, device: Device) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: user.user_id,
          email: user.email,
          device_id: device.device_id,
        },
        { expiresIn: '10s' },
      ),
      this.jwtService.signAsync(
        {
          sub: user.user_id,
          device_id: device.device_id,
          type: 'refresh',
        },
        { expiresIn: '7d' },
      ),
    ]);

    // Create device authentication record
    const deviceAuth = this.deviceAuthRepository.create({
      device_id: device.device_id,
      refresh_token: refreshToken,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      is_valid: true,
    });

    await this.deviceAuthRepository.save(deviceAuth);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { verification_token: token },
    });

    if (!user) {
      throw new NotFoundException('Invalid verification token');
    }

    if (user.email_verified) {
      return { message: 'Email already verified' };
    }

    user.email_verified = true;
    user.verification_token = null;
    await this.userRepository.save(user);

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Return success even if user doesn't exist for security
      return { message: 'Password reset email sent if account exists' };
    }

    const resetToken = uuidv4();
    user.reset_password_token = resetToken;
    user.reset_token_expires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await this.userRepository.save(user);

    await this.emailService.sendPasswordResetEmail(user, resetToken);

    return { message: 'Password reset email sent if account exists' };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { reset_password_token: token },
    });

    if (
      !user ||
      !user.reset_token_expires ||
      user.reset_token_expires < new Date()
    ) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password_hash = hashedPassword;
    user.reset_password_token = null;
    user.reset_token_expires = null;
    await this.userRepository.save(user);

    // Log security event
    const device = await this.deviceRepository.findOne({
      where: { user_id: user.user_id },
      order: { last_active: 'DESC' },
    });
    await this.securityEventService.logPasswordChanged(user, device);

    return { message: 'Password reset successful' };
  }

  async refreshTokens(
    refreshToken: string,
    deviceId: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    console.log('\n=== TOKEN REFRESH ATTEMPT ===');
    console.log('Refresh token length:', refreshToken?.length);
    console.log('Device ID:', deviceId);

    const refreshPayload = await this.validateRefreshToken(refreshToken);
    console.log('Refresh payload:', {
      sub: refreshPayload.sub,
      exp: new Date(refreshPayload.exp * 1000).toISOString(),
    });

    const user = await this.validateUser(refreshPayload.sub);
    const device = await this.validateUserDevice(refreshPayload.sub, deviceId);

    console.log('Validation results:', {
      userFound: !!user,
      deviceFound: !!device,
      deviceName: device?.device_name,
    });

    if (!user || !device) {
      console.log('❌ Token refresh failed: Invalid refresh token');
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Invalidate old refresh token
    console.log('Invalidating old refresh token for device:', device.device_id);
    await this.deviceAuthRepository.update(
      { device_id: device.device_id, refresh_token: refreshToken },
      { is_valid: false, revoked_at: new Date() },
    );

    // Generate new tokens
    console.log('Generating new tokens for user:', user.user_id);
    const tokens = await this.generateTokens(user, device);
    console.log('✅ Token refresh successful');
    return tokens;
  }

  async logout(userId: string, deviceId: string): Promise<{ message: string }> {
    const device = await this.validateUserDevice(userId, deviceId);
    if (!device) {
      throw new UnauthorizedException('Invalid device');
    }

    device.is_active = false;
    await this.deviceRepository.save(device);

    // Invalidate all device authentications
    await this.deviceAuthRepository.update(
      { device_id: deviceId },
      {
        is_valid: false,
        revoked_at: new Date(),
        revoked_by_ip: device.last_ip_address,
      },
    );

    return { message: 'Logout successful' };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      // Return success even if user doesn't exist for security
      return { message: 'Verification email sent if account exists' };
    }

    if (user.email_verified) {
      return { message: 'Email already verified' };
    }

    const verificationToken = uuidv4();
    user.verification_token = verificationToken;
    await this.userRepository.save(user);

    await this.emailService.sendVerificationEmail(user, verificationToken);

    return { message: 'Verification email sent if account exists' };
  }

  async getProfile(userId: string): Promise<User> {
    return this.userRepository.findOne({ where: { user_id: userId } });
  }

  async validateUser(userId: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      select: [
        'user_id',
        'email',
        'username',
        'full_name',
        'email_verified',
        'account_status',
        'preferred_language',
        'subscription_tier',
      ],
    });

    if (!user || user.account_status !== 'active') {
      return null;
    }

    return user;
  }

  async validateUserCredentials(
    identifier: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  // Helper method to validate refresh tokens
  async validateRefreshToken(token: string): Promise<any> {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_REFRESH_SECRET, // Make sure to set this in your .env
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const user = await this.validateUser(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      return payload;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // Helper method to check if a device belongs to a user
  async validateUserDevice(
    userId: string,
    deviceId: string,
  ): Promise<Device | null> {
    const device = await this.deviceRepository.findOne({
      where: {
        user_id: userId,
        device_id: deviceId,
        is_active: true,
      },
      select: ['device_id', 'user_id', 'device_name', 'is_active'],
    });

    return device;
  }

  // Helper method to validate user's account status
  async validateUserStatus(userId: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      select: ['account_status'],
    });

    return user?.account_status === 'active';
  }

  async generateLoginQR(
    userId: string,
  ): Promise<{ qrId: string; qrCode: string }> {
    // Generate unique QR session ID
    const qrId = uuidv4();

    // Store QR session with userId in Redis
    await this.redis.set(
      `qr_login:${qrId}`,
      JSON.stringify({
        status: 'pending',
        ownerId: userId, // Store the user who generated the QR
        createdAt: new Date().toISOString(),
      }),
      'EX',
      300, // 5 minutes expiration
    );

    // Generate QR code
    const loginUrl = `${process.env.WEB_URL}/qr-login/${qrId}`;
    const qrCode = await QRCode.toDataURL(loginUrl);

    return { qrId, qrCode };
  }

  async authenticateQRLogin(
    qrId: string,
    authenticatingUserId: string,
    deviceInfo: { name: string },
  ): Promise<void> {
    // Get QR session data
    const sessionData = await this.redis.get(`qr_login:${qrId}`);
    if (!sessionData) {
      throw new UnauthorizedException('QR code expired or invalid');
    }

    const session = JSON.parse(sessionData);

    // Verify the QR belongs to the authenticating user
    if (session.ownerId !== authenticatingUserId) {
      throw new UnauthorizedException('This QR code belongs to another user');
    }

    // Rest of your device creation logic...
    const device = await this.deviceRepository.create({
      user_id: authenticatingUserId,
      device_name: deviceInfo.name,
      // ... other device info
    });

    // Update QR session status
    await this.redis.set(
      `qr_login:${qrId}`,
      JSON.stringify({
        ...session,
        status: 'authenticated',
        deviceId: device.device_id,
        authenticatedAt: new Date().toISOString(),
      }),
      'EX',
      30, // Short expiration after auth
    );
  }

  async findDeviceById(deviceId: string): Promise<Device | null> {
    return this.deviceRepository.findOne({
      where: { device_id: deviceId },
      select: ['device_id', 'user_id', 'device_name', 'is_active'],
    });
  }
}
