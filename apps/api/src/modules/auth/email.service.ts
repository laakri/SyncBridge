import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '../../entities/user.entity';
import { Device } from '../../entities/device.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class EmailService {
  constructor(
    private mailerService: MailerService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private async sendEmail(
    to: string,
    subject: string,
    template: string,
    context: any,
  ) {
    try {
      await this.mailerService.sendMail({
        to,
        subject,
        template,
        context,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new InternalServerErrorException(
        'Failed to send verification email. Please try again later.',
      );
    }
  }

  async sendVerificationEmail(user: User, verificationToken: string) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    await this.sendEmail(
      user.email,
      'Verify Your Email Address',
      'verification',
      {
        name: user.full_name || user.username,
        verificationUrl,
      },
    );
  }

  async sendPasswordResetEmail(user: User, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await this.sendEmail(user.email, 'Reset Your Password', 'password-reset', {
      name: user.full_name || user.username,
      resetUrl,
    });
  }

  async sendNewDeviceNotification(user: User, device: Device) {
    await this.sendEmail(
      user.email,
      'New Device Login Detected',
      'new-device-notification',
      {
        name: user.full_name || user.username,
        deviceName: device.device_name,
        deviceType: device.device_type,
        ipAddress: device.last_ip_address,
        loginTime: new Date().toLocaleString(),
      },
    );
  }

  async sendDeviceRemovedEmail(
    userId: string,
    deviceName: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
    });
    if (!user) return;

    await this.sendEmail(
      user.email,
      'Device Removed from Your Account',
      'device-removed',
      {
        name: user.full_name || user.username,
        deviceName: deviceName,
        removedAt: new Date().toLocaleString(),
      },
    );
  }
}
