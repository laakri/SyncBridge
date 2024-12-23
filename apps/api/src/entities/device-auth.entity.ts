import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Device } from './device.entity';

@Entity('device_authentications')
export class DeviceAuthentication {
  @PrimaryGeneratedColumn('uuid')
  auth_id: string;

  @Column()
  device_id: string;

  @Column({ name: 'refresh_token', type: 'text' })
  refresh_token: string;

  @Column()
  expires_at: Date;

  @Column({ default: true })
  is_valid: boolean;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  revoked_at: Date;

  @Column({ nullable: true })
  revoked_by_ip: string;

  @ManyToOne(() => Device, (device) => device.authentications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'device_id' })
  device: Device;
}
