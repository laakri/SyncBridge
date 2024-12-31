import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Device } from './device.entity';

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  DEVICE_PAIRED = 'device_paired',
  DEVICE_REMOVED = 'device_removed',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  PASSWORD_CHANGED = 'password_changed',
  TWO_FACTOR_ENABLED = 'two_factor_enabled',
  TWO_FACTOR_DISABLED = 'two_factor_disabled',
  PROFILE_UPDATED = 'profile_updated',
  EMAIL_CHANGED = 'email_changed',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  UNUSUAL_LOGIN_LOCATION = 'unusual_login_location',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  SECURITY_SETTINGS_CHANGED = 'security_settings_changed',
}

export enum SecurityEventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

@Entity('security_events')
export class SecurityEvent {
  @PrimaryGeneratedColumn('uuid')
  event_id: string;

  @Column({
    type: 'enum',
    enum: SecurityEventType,
  })
  event_type: SecurityEventType;

  @Column({ type: 'text', nullable: true })
  event_description: string;

  @Column({ nullable: true })
  ip_address: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({
    type: 'enum',
    enum: SecurityEventSeverity,
  })
  severity: SecurityEventSeverity;

  @Column({ default: false })
  is_resolved: boolean;

  @Column({ nullable: true })
  resolved_at: Date;

  @Column({ type: 'text', nullable: true })
  resolution_notes: string;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @ManyToOne(() => Device, (device) => device.securityEvents)
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column({ nullable: true })
  device_id: string;
}
