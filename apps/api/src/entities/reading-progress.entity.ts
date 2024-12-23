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
import { SyncData } from './sync-data.entity';

@Entity('reading_progress')
export class ReadingProgress {
  @PrimaryGeneratedColumn('uuid')
  progress_id: string;

  @Column()
  title: string;

  @Column()
  current_position: number;

  @Column({ nullable: true })
  total_position: number;

  @CreateDateColumn()
  last_updated: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ default: false })
  is_completed: boolean;

  @Column({ nullable: true })
  completion_date: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @ManyToOne(() => Device)
  @JoinColumn({ name: 'device_id' })
  device: Device;

  @Column()
  device_id: string;

  @ManyToOne(() => SyncData)
  @JoinColumn({ name: 'content_id' })
  content: SyncData;

  @Column()
  content_id: string;
}
