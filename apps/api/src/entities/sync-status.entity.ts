import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Device } from './device.entity';
import { SyncData } from './sync-data.entity';

export enum SyncState {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CONFLICT = 'conflict',
}

export enum ConflictResolutionStrategy {
  LATEST_WINS = 'latest_wins',
  SOURCE_WINS = 'source_wins',
  DESTINATION_WINS = 'destination_wins',
  MANUAL = 'manual',
}

@Entity('sync_status')
@Unique(['sync_id', 'device_id'])
export class SyncStatus {
  @PrimaryGeneratedColumn('uuid')
  status_id: string;

  @Column({
    type: 'enum',
    enum: SyncState,
    default: SyncState.PENDING,
  })
  sync_state: SyncState;

  @Column({ nullable: true })
  last_sync_attempt: Date;

  @Column({ nullable: true })
  last_successful_sync: Date;

  @Column({ type: 'text', nullable: true })
  error_message: string;

  @Column({ default: 0 })
  retry_count: number;

  @Column({ nullable: true })
  version: number;

  @Column({
    type: 'enum',
    enum: ConflictResolutionStrategy,
    nullable: true,
  })
  conflict_resolution_strategy: ConflictResolutionStrategy;

  @Column()
  sync_id: string;

  @Column()
  device_id: string;

  @ManyToOne(() => SyncData, (syncData) => syncData.syncStatuses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'sync_id' })
  syncData: SyncData;

  @ManyToOne(() => Device, (device) => device.syncStatuses, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'device_id' })
  device: Device;
}
