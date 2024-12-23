import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Device } from './device.entity';
import { DeviceGroup } from './device-group.entity';

@Entity('device_group_membership')
@Unique(['group_id', 'device_id'])
export class DeviceGroupMembership {
  @PrimaryGeneratedColumn('uuid')
  membership_id: string;

  @CreateDateColumn()
  added_at: Date;

  // Relations
  @ManyToOne(() => DeviceGroup, (group) => group.memberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group: DeviceGroup;

  @Column()
  group_id: string;

  @ManyToOne(() => Device, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column()
  device_id: string;

  @ManyToOne(() => Device)
  @JoinColumn({ name: 'added_by_device_id' })
  addedByDevice: Device;

  @Column({ nullable: true })
  added_by_device_id: string;
}
