import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { SecurityEventService } from '../auth/security/security-event.service';
import { SecurityEventSeverity } from 'src/entities/security-event.entity';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private securityEventService: SecurityEventService,
  ) {}

  async getUserProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['devices', 'syncData'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const securitySummary =
      await this.securityEventService.getUnresolvedEvents(user);

    return {
      user: {
        id: user.user_id,
        email: user.email,
        username: user.username,
        full_name: user.full_name,
        profile_picture_url: user.profile_picture_url,
        created_at: user.created_at,
        last_login: user.last_login,
        email_verified: user.email_verified,
        subscription_tier: user.subscription_tier,
        account_status: user.account_status,
        preferred_language: user.preferred_language,
        timezone: user.timezone,
        storage_quota: user.storage_quota,
        storage_used: user.storage_used,
      },
      security: {
        email_verified: user.email_verified,
        account_status: user.account_status,
        last_login: user.last_login,
        unresolvedEvents: securitySummary,
        highSeverityCount: securitySummary.filter(
          (event) => event.severity === SecurityEventSeverity.HIGH,
        ).length,
      },
      devices: user.devices.map((device) => ({
        id: device.device_id,
        name: device.device_name,
        type: device.device_type,
        last_active: device.last_active,
        is_active: device.is_active,
      })),
    };
  }
}
