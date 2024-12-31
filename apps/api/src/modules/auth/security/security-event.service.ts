import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { In } from 'typeorm';

import { User } from '../../../entities/user.entity';
import { Device } from '../../../entities/device.entity';
import {
  SecurityEvent,
  SecurityEventType,
  SecurityEventSeverity,
} from '../../../entities/security-event.entity';

@Injectable()
export class SecurityEventService {
  constructor(
    @InjectRepository(SecurityEvent)
    private securityEventRepository: Repository<SecurityEvent>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async logLoginEvent(
    user: User,
    device: Device,
    success: boolean,
    ipAddress?: string,
  ): Promise<SecurityEvent> {
    return this.createSecurityEvent({
      user,
      device,
      event_type: success
        ? SecurityEventType.LOGIN_SUCCESS
        : SecurityEventType.LOGIN_FAILED,
      severity: success
        ? SecurityEventSeverity.LOW
        : SecurityEventSeverity.MEDIUM,
      event_description: `Login ${success ? 'successful' : 'failed'} from device ${device.device_name}`,
      ip_address: ipAddress,
    });
  }

  async logDevicePaired(
    user: User,
    device: Device,
    ipAddress?: string,
  ): Promise<SecurityEvent> {
    return this.createSecurityEvent({
      user,
      device,
      event_type: SecurityEventType.DEVICE_PAIRED,
      severity: SecurityEventSeverity.MEDIUM,
      event_description: `New device paired: ${device.device_name}`,
      ip_address: ipAddress,
    });
  }

  async logDeviceRemoved(
    user: User,
    device: Device,
    removedByDevice: Device,
    ipAddress?: string,
  ): Promise<SecurityEvent> {
    return this.createSecurityEvent({
      user,
      device,
      event_type: SecurityEventType.DEVICE_REMOVED,
      severity: SecurityEventSeverity.MEDIUM,
      event_description: `Device ${device.device_name} removed by ${removedByDevice.device_name}`,
      ip_address: ipAddress,
    });
  }

  async logSuspiciousActivity(
    user: User,
    device: Device,
    description: string,
    ipAddress?: string,
  ): Promise<SecurityEvent> {
    return this.createSecurityEvent({
      user,
      device,
      event_type: SecurityEventType.SUSPICIOUS_ACTIVITY,
      severity: SecurityEventSeverity.HIGH,
      event_description: description,
      ip_address: ipAddress,
    });
  }

  async logPasswordChanged(
    user: User,
    device: Device,
    ipAddress?: string,
  ): Promise<SecurityEvent> {
    return this.createSecurityEvent({
      user,
      device,
      event_type: SecurityEventType.PASSWORD_CHANGED,
      severity: SecurityEventSeverity.MEDIUM,
      event_description: 'Password changed successfully',
      ip_address: ipAddress,
    });
  }

  async logTwoFactorEnabled(
    user: User,
    device: Device,
    ipAddress?: string,
  ): Promise<SecurityEvent> {
    return this.createSecurityEvent({
      user,
      device,
      event_type: SecurityEventType.TWO_FACTOR_ENABLED,
      severity: SecurityEventSeverity.MEDIUM,
      event_description: 'Two-factor authentication enabled',
      ip_address: ipAddress,
    });
  }

  async logTwoFactorDisabled(
    user: User,
    device: Device,
    ipAddress?: string,
  ): Promise<SecurityEvent> {
    return this.createSecurityEvent({
      user,
      device,
      event_type: SecurityEventType.TWO_FACTOR_DISABLED,
      severity: SecurityEventSeverity.HIGH,
      event_description: 'Two-factor authentication disabled',
      ip_address: ipAddress,
    });
  }

  async getRecentEvents(
    user: User,
    options: {
      limit?: number;
      severity?: SecurityEventSeverity[];
      eventTypes?: SecurityEventType[];
      startDate?: Date;
      endDate?: Date;
    } = {},
  ): Promise<SecurityEvent[]> {
    const query = this.securityEventRepository
      .createQueryBuilder('event')
      .where('event.user_id = :userId', { userId: user.user_id })
      .leftJoinAndSelect('event.device', 'device')
      .orderBy('event.created_at', 'DESC');

    if (options.severity?.length) {
      query.andWhere('event.severity IN (:...severities)', {
        severities: options.severity,
      });
    }

    if (options.eventTypes?.length) {
      query.andWhere('event.event_type IN (:...types)', {
        types: options.eventTypes,
      });
    }

    if (options.startDate) {
      query.andWhere('event.created_at >= :startDate', {
        startDate: options.startDate,
      });
    }

    if (options.endDate) {
      query.andWhere('event.created_at <= :endDate', {
        endDate: options.endDate,
      });
    }

    return query.take(options.limit || 10).getMany();
  }

  async getUnresolvedEvents(user: User): Promise<SecurityEvent[]> {
    return this.securityEventRepository.find({
      where: {
        user_id: user.user_id,
        is_resolved: false,
        severity: SecurityEventSeverity.HIGH,
      },
      order: { created_at: 'DESC' },
      relations: ['device'],
    });
  }

  async logProfileEvent(
    user: User,
    device: Device,
    action: 'update' | 'email_change' | 'settings_change',
    details: string,
    ipAddress?: string,
  ): Promise<SecurityEvent> {
    const eventType =
      action === 'update'
        ? SecurityEventType.PROFILE_UPDATED
        : action === 'email_change'
          ? SecurityEventType.EMAIL_CHANGED
          : SecurityEventType.SECURITY_SETTINGS_CHANGED;

    return this.createSecurityEvent({
      user,
      device,
      event_type: eventType,
      severity: SecurityEventSeverity.MEDIUM,
      event_description: details,
      ip_address: ipAddress,
    });
  }

  async logAccountSecurityEvent(
    user: User,
    device: Device,
    action: 'lock' | 'unlock',
    reason: string,
    ipAddress?: string,
  ): Promise<SecurityEvent> {
    return this.createSecurityEvent({
      user,
      device,
      event_type:
        action === 'lock'
          ? SecurityEventType.ACCOUNT_LOCKED
          : SecurityEventType.ACCOUNT_UNLOCKED,
      severity: SecurityEventSeverity.HIGH,
      event_description: reason,
      ip_address: ipAddress,
    });
  }

  async resolveSecurityEvent(
    eventId: string,
    userId: string,
    resolutionNotes: string,
  ): Promise<SecurityEvent> {
    const event = await this.securityEventRepository.findOne({
      where: { event_id: eventId, user_id: userId },
    });

    if (!event) {
      throw new NotFoundException('Security event not found');
    }

    event.is_resolved = true;
    event.resolved_at = new Date();
    event.resolution_notes = resolutionNotes;

    return this.securityEventRepository.save(event);
  }

  async getSecuritySummary(userId: string): Promise<{
    recentEvents: SecurityEvent[];
    highSeverityCount: number;
    unresolvedCount: number;
    lastLoginAttempt: SecurityEvent | null;
  }> {
    const user = await this.userRepository.findOne({
      where: { user_id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [recentEvents, highSeverityCount, unresolvedCount, lastLoginAttempt] =
      await Promise.all([
        this.getRecentEvents(user, { limit: 5 }),
        this.securityEventRepository.count({
          where: {
            user_id: userId,
            severity: SecurityEventSeverity.HIGH,
            is_resolved: false,
          },
        }),
        this.securityEventRepository.count({
          where: {
            user_id: userId,
            is_resolved: false,
          },
        }),
        this.securityEventRepository.findOne({
          where: {
            user_id: userId,
            event_type: In([
              SecurityEventType.LOGIN_SUCCESS,
              SecurityEventType.LOGIN_FAILED,
            ]),
          },
          order: { created_at: 'DESC' },
        }),
      ]);

    return {
      recentEvents,
      highSeverityCount,
      unresolvedCount,
      lastLoginAttempt,
    };
  }

  private async createSecurityEvent(params: {
    user: User;
    device: Device;
    event_type: SecurityEventType;
    severity: SecurityEventSeverity;
    event_description: string;
    ip_address?: string;
  }): Promise<SecurityEvent> {
    const event = this.securityEventRepository.create({
      user_id: params.user.user_id,
      device_id: params.device.device_id,
      event_type: params.event_type,
      severity: params.severity,
      event_description: params.event_description,
      ip_address: params.ip_address,
    });

    return this.securityEventRepository.save(event);
  }
}
