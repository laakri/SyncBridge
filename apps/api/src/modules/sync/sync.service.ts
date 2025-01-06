import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncData, ContentType } from '../../entities/sync-data.entity';
import { SyncStatus, SyncState } from '../../entities/sync-status.entity';
import { Device } from '../../entities/device.entity';
import { WsGateway } from '../ws/ws.gateway';
import { v4 as uuid } from 'uuid';

export interface DeviceStats {
  clipboard: number;
  file: number;
  note: number;
  link: number;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger('SyncService');

  constructor(
    @InjectRepository(SyncData)
    private syncDataRepository: Repository<SyncData>,
    @InjectRepository(SyncStatus)
    private syncStatusRepository: Repository<SyncStatus>,
    @InjectRepository(Device)
    private deviceRepository: Repository<Device>,
    @Inject(forwardRef(() => WsGateway))
    private wsGateway: WsGateway,
  ) {}

  async createSync(
    userId: string,
    deviceId: string,
    data: {
      content: string;
      content_type: ContentType;
      metadata?: Record<string, any>;
      parent_sync_id?: string;
    },
  ) {
    const device = await this.deviceRepository.findOne({
      where: { device_id: deviceId, user_id: userId },
    });

    if (!device) {
      throw new NotFoundException('Device not found');
    }

    const syncData = this.syncDataRepository.create({
      user_id: userId,
      source_device_id: deviceId,
      content_type: data.content_type,
      content: {
        value: data.content,
        timestamp: new Date().toISOString(),
      },
      metadata: data.metadata || {},
      parent_sync_id: data.parent_sync_id,
      is_deleted: false,
      is_favorite: false,
      version: 1,
    });

    const savedSync = await this.syncDataRepository.save(syncData);

    await this.syncStatusRepository.save({
      sync_id: savedSync.sync_id,
      device_id: deviceId,
      sync_state: SyncState.COMPLETED,
      last_successful_sync: new Date(),
      version: savedSync.version,
    });

    await this.wsGateway.broadcastToUser(userId, 'sync:new', {
      sync_id: savedSync.sync_id,
      content_type: savedSync.content_type,
      source_device_id: deviceId,
    });

    return savedSync;
  }

  async getRecentSyncs(
    userId: string,
    deviceId: string,
    contentType?: ContentType,
    since?: Date,
    limit: number = 50,
  ): Promise<SyncData[]> {
    const query = this.syncDataRepository
      .createQueryBuilder('sync')
      .leftJoinAndSelect('sync.sourceDevice', 'device')
      .where('sync.user_id = :userId', { userId })
      .andWhere('sync.is_deleted = false');

    if (contentType) {
      query.andWhere('sync.content_type = :contentType', { contentType });
    }

    if (since) {
      query.andWhere('sync.created_at > :since', { since });
    }

    return query.orderBy('sync.created_at', 'DESC').take(limit).getMany();
  }

  async updateSyncStatus(
    syncId: string,
    deviceId: string,
    state: keyof typeof SyncState,
  ) {
    const existingStatus = await this.syncStatusRepository.findOne({
      where: { sync_id: syncId, device_id: deviceId },
    });

    if (existingStatus) {
      return this.syncStatusRepository.update(
        { sync_id: syncId, device_id: deviceId },
        {
          sync_state: SyncState[state],
          last_successful_sync: state === 'COMPLETED' ? new Date() : undefined,
          last_sync_attempt: new Date(),
        },
      );
    }

    return this.syncStatusRepository.save({
      sync_id: syncId,
      device_id: deviceId,
      sync_state: SyncState[state],
      last_sync_attempt: new Date(),
      last_successful_sync: state === 'COMPLETED' ? new Date() : undefined,
      version: 1,
    });
  }

  private async generateChecksum(content: string): Promise<string> {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async getDeviceStats(userId: string): Promise<DeviceStats> {
    const stats = await this.syncDataRepository
      .createQueryBuilder('sync')
      .select('sync.content_type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('sync.user_id = :userId', { userId })
      .andWhere('sync.is_deleted = false')
      .groupBy('sync.content_type')
      .getRawMany();

    return {
      clipboard: parseInt(
        stats.find((s) => s.type === 'clipboard')?.count || '0',
      ),
      file: parseInt(stats.find((s) => s.type === 'file')?.count || '0'),
      note: parseInt(stats.find((s) => s.type === 'note')?.count || '0'),
      link: parseInt(stats.find((s) => s.type === 'link')?.count || '0'),
    };
  }

  async getFavoriteSyncs(userId: string, limit: number = 5) {
    return await this.syncDataRepository.find({
      where: {
        user_id: userId,
        is_favorite: true,
        is_deleted: false,
      },
      order: {
        created_at: 'DESC',
      },
      take: limit,
    });
  }

  async toggleFavorite(syncId: string, userId: string): Promise<boolean> {
    console.log('[SyncService] Toggling favorite for sync:', syncId);

    const sync = await this.syncDataRepository.findOne({
      where: {
        sync_id: syncId,
        user_id: userId,
        is_deleted: false,
      },
    });

    if (!sync) {
      throw new Error('Sync not found');
    }

    sync.is_favorite = !sync.is_favorite;
    await this.syncDataRepository.save(sync);

    return sync.is_favorite;
  }

  async deleteSync(syncId: string, userId: string): Promise<boolean> {
    console.log('[SyncService] Deleting sync:', syncId);

    const sync = await this.syncDataRepository.findOne({
      where: {
        sync_id: syncId,
        user_id: userId,
        is_deleted: false,
      },
    });

    if (!sync) {
      throw new Error('Sync not found');
    }

    sync.is_deleted = true;
    await this.syncDataRepository.save(sync);

    return true;
  }
}
