import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
    limit: number = 10,
  ): Promise<SecurityEvent[]> {
    return this.securityEventRepository.find({
      where: { user_id: user.user_id },
      order: { created_at: 'DESC' },
      take: limit,
      relations: ['device'],
    });
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
