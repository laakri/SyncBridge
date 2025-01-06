import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { SecurityEventService } from '../auth/security/security-event.service';
import { SecurityEventSeverity } from 'src/entities/security-event.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

  async getProfileStats(userId: string) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
      relations: ['devices', 'syncData'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const activeDevices = user.devices.filter((device) => device.is_active);

    return {
      accountStatus: user.account_status,
      subscriptionTier: user.subscription_tier,
      storageUsed: user.storage_used,
      storageLimit: user.storage_quota,
      storagePercentage: (user.storage_used / user.storage_quota) * 100,
      activeDevices: activeDevices.length,
      totalDevices: user.devices.length,
      totalSyncs: user.syncData.length,
      memberSince: user.created_at,
      lastLogin: user.last_login,
    };
  }

  async updateProfile(userId: string, updateDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (updateDto.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateDto.username },
      });

      if (existingUser && existingUser.user_id !== userId) {
        throw new ConflictException('Username already taken');
      }
    }

    Object.assign(user, updateDto);
    await this.userRepository.save(user);

    return this.getUserProfile(userId);
  }

  async getSecurityOverview(userId: string) {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const securityEvents =
      await this.securityEventService.getUnresolvedEvents(user);
    const recentEvents = securityEvents.map((event) => ({
      id: event.event_id,
      type: event.event_type,
      description: event.event_description,
      severity: event.severity.toLowerCase(),
      created_at: event.created_at,
      device: event.device
        ? {
            device_name: event.device.device_name,
            device_type: event.device.device_type,
          }
        : null,
    }));

    return {
      email_verified: user.email_verified,
      account_status: user.account_status,
      last_login: user.last_login,
      recentEvents,
      highSeverityCount: recentEvents.filter(
        (event) => event.severity === 'high',
      ).length,
      unresolvedCount: recentEvents.length,
    };
  }
}
