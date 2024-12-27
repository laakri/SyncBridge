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
import { Device } from './device.entity';
import { SyncStatus } from './sync-status.entity';

export enum ContentType {
  CLIPBOARD = 'clipboard',
  LINK = 'link',
  FILE = 'file',
  NOTE = 'note',
}

@Entity('sync_data')
export class SyncData {
  @PrimaryGeneratedColumn('uuid')
  sync_id: string;

  @Column({
    type: 'enum',
    enum: ContentType,
    name: 'content_type',
  })
  content_type: ContentType;

  @Column({ type: 'jsonb' })
  content: Record<string, any>;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  last_modified: Date;

  @Column({ default: false })
  is_deleted: boolean;

  @Column({ name: 'is_favorite', default: false })
  is_favorite: boolean;

  @Column({ default: 1 })
  version: number;

  @Column({ nullable: true })
  size_bytes: number;

  @Column({ nullable: true })
  checksum: string;

  @Column({ nullable: true })
  encryption_key: string;

  // Relations
  @ManyToOne(() => User, (user) => user.syncData, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @ManyToOne(() => Device)
  @JoinColumn({ name: 'source_device_id' })
  sourceDevice: Device;

  @Column()
  source_device_id: string;

  @ManyToOne(() => SyncData, { nullable: true })
  @JoinColumn({ name: 'parent_sync_id' })
  parentSync: SyncData;

  @Column({ nullable: true })
  parent_sync_id: string;

  @OneToMany(() => SyncStatus, (status) => status.syncData)
  syncStatuses: SyncStatus[];
}
