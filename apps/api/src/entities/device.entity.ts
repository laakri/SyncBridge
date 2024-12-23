import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { DeviceAuthentication } from './device-auth.entity';
import { SecurityEvent } from './security-event.entity';
import { SyncStatus } from './sync-status.entity';

export enum DeviceType {
  DESKTOP = 'desktop',
  MOBILE = 'mobile',
  TABLET = 'tablet',
  OTHER = 'other',
}

export enum OSType {
  WINDOWS = 'windows',
  MACOS = 'macos',
  LINUX = 'linux',
  IOS = 'ios',
  ANDROID = 'android',
  OTHER = 'other',
}

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn('uuid')
  device_id: string;

  @Column()
  user_id: string;

  @Column()
  device_name: string;

  @Column({
    type: 'enum',
    enum: DeviceType,
    default: DeviceType.OTHER,
  })
  device_type: DeviceType;

  @Column({
    type: 'enum',
    enum: OSType,
    default: OSType.OTHER,
  })
  os_type: OSType;

  @Column({ nullable: true })
  browser_type: string;

  @Column({ nullable: true })
  last_ip_address: string;

  @Column({ unique: true })
  device_token: string;

  @Column({ type: 'jsonb', default: {} })
  device_settings: Record<string, any>;

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: true })
  sync_enabled: boolean;

  @Column({ default: true })
  auto_sync: boolean;

  @Column({ default: 300 })
  sync_interval: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_active: Date;

  @ManyToOne(() => User, (user) => user.devices)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => DeviceAuthentication, (auth) => auth.device)
  authentications: DeviceAuthentication[];

  @OneToMany(() => SecurityEvent, (event) => event.device)
  securityEvents: SecurityEvent[];

  @OneToMany(() => SyncStatus, (status) => status.device)
  syncStatuses: SyncStatus[];
}
