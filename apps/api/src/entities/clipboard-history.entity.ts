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

export enum ClipboardContentType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
  URL = 'url',
  HTML = 'html',
  RTF = 'rtf',
}

@Entity('clipboard_history')
export class ClipboardHistory {
  @PrimaryGeneratedColumn('uuid')
  clipboard_id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: ClipboardContentType,
  })
  content_type: ClipboardContentType;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @Column({ nullable: true })
  expires_at: Date;

  @Column({ default: false })
  is_favorite: boolean;

  @Column({ nullable: true })
  size_bytes: number;

  @Column({ nullable: true })
  checksum: string;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  user_id: string;

  @ManyToOne(() => Device)
  @JoinColumn({ name: 'source_device_id' })
  sourceDevice: Device;

  @Column()
  source_device_id: string;
}
