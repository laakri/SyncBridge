import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SyncData, ContentType } from '../../entities/sync-data.entity';
import { SyncStatus, SyncState } from '../../entities/sync-status.entity';
import { Device } from '../../entities/device.entity';
import { WsGateway } from '../ws/ws.gateway';

export interface DeviceStats {
  clipboard: number;
  file: number;
  note: number;
  link: number;
}

@Injectable()
export class SyncService {
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
      content: {
        value: data.content,
        timestamp: new Date(),
      },
      content_type: data.content_type,
      metadata: data.metadata,
      parent_sync_id: data.parent_sync_id,
      version: 1,
      size_bytes: Buffer.from(data.content).length,
      checksum: await this.generateChecksum(data.content),
    });

    const savedSync = await this.syncDataRepository.save(syncData);

    // Create initial sync status for source device
    await this.syncStatusRepository.save({
      sync_id: savedSync.sync_id,
      device_id: deviceId,
      sync_state: SyncState.COMPLETED,
      last_successful_sync: new Date(),
      version: savedSync.version,
    });

    // Notify other devices about new sync data
    await this.wsGateway.broadcastToUser(userId, 'sync:new', {
      sync_id: savedSync.sync_id,
      content_type: savedSync.content_type,
      source_device_id: deviceId,
    });

    return savedSync;
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

  async getRecentSyncs(
    userId: string,
    deviceId: string,
    contentType?: ContentType,
    since?: Date,
    limit: number = 50,
  ) {
    console.log('Getting recent syncs with params:', {
      userId,
      deviceId,
      contentType,
      since,
      limit,
    });

    const query = this.syncDataRepository
      .createQueryBuilder('sync')
      .where('sync.user_id = :userId', { userId })
      .andWhere('sync.is_deleted = false');

    if (contentType) {
      query.andWhere('sync.content_type = :contentType', { contentType });
    }

    if (since) {
      query.andWhere('sync.created_at > :since', { since });
    }

    const syncs = await query
      .orderBy('sync.created_at', 'DESC')
      .take(limit)
      .getMany();

    console.log(`Found ${syncs.length} syncs`);
    return syncs;
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

    console.log('Device stats:', stats);

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

    console.log('[SyncService] Updated favorite status:', {
      syncId,
      isFavorite: sync.is_favorite,
    });

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

    console.log('[SyncService] Sync marked as deleted:', syncId);
    return true;
  }
}
