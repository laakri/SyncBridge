import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
  Unique,
} from 'typeorm';
import { Device } from './device.entity';
import { SyncData } from './sync-data.entity';

export enum AccountStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated',
}

export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium',
  BUSINESS = 'business',
}

@Entity('users')
@Unique(['email'])
@Index(['email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  user_id: string;

  @Column({
    unique: true,
    length: 255,
    transformer: {
      to: (value: string) => value.toLowerCase(),
      from: (value: string) => value,
    },
  })
  email: string;

  @Column({ length: 50 })
  username: string;

  @Column({ name: 'password_hash', length: 255 })
  password_hash: string;

  @Column({ nullable: true })
  full_name: string;

  @Column({ default: false })
  email_verified: boolean;

  @Column({ nullable: true })
  verification_token: string;

  @Column({ nullable: true })
  reset_password_token: string;

  @Column({ nullable: true })
  reset_token_expires: Date;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  last_login: Date;

  @Column({
    type: 'enum',
    enum: AccountStatus,
    default: AccountStatus.ACTIVE,
  })
  account_status: AccountStatus;

  @Column({ nullable: true, length: 255 })
  profile_picture_url: string;

  @Column({ default: 'en', length: 5 })
  preferred_language: string;

  @Column({ nullable: true, length: 50 })
  timezone: string;

  @Column({ type: 'bigint', default: 5368709120 }) // 5GB in bytes
  storage_quota: number;

  @Column({ type: 'bigint', default: 0 })
  storage_used: number;

  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    default: SubscriptionTier.FREE,
  })
  subscription_tier: SubscriptionTier;

  @OneToMany(() => Device, (device) => device.user)
  devices: Device[];

  @OneToMany(() => SyncData, (syncData) => syncData.user)
  syncData: SyncData[];
}
