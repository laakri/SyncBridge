import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './ws-jwt.guard';
import { SyncService } from '../sync/sync.service';
import { ContentType } from '../../entities/sync-data.entity';
import { AuthenticatedSocket } from './types/socket.interface';

interface SyncPayload {
  content: string;
  content_type: ContentType;
  metadata?: Record<string, any>;
  parent_sync_id?: string;
  target_devices?: string[];
}

export interface DeviceStats {
  clipboard: number;
  file: number;
  note: number;
  link: number;
}
export interface Device {
  device_id: string;
  device_name: string;
  is_connected: boolean;
  last_active: Date;
}
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST'],
    allowedHeaders: [
      'Authorization',
      'device-id',
      'refresh-token',
      'Access-Control-Allow-Credentials',
    ],
    exposedHeaders: ['Access-Control-Allow-Credentials'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },
  path: '/socket.io/',
  serveClient: false,
  transports: ['polling', 'websocket'],
  allowEIO3: true,
  pingTimeout: 60000,
  pingInterval: 25000,
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedDevices = new Map<string, AuthenticatedSocket>();

  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
    private syncService: SyncService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth.token?.split(' ')[1];
      const deviceId = client.handshake.auth.deviceId;

      if (!token || !deviceId) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const device = await this.authService.findDeviceById(deviceId);

      if (!device || device.user_id !== payload.sub) {
        client.disconnect();
        return;
      }

      client.user = {
        sub: payload.sub,
        email: payload.email,
        deviceId: deviceId,
      };

      await this.authService.updateDeviceStatus(deviceId, true);
      this.connectedDevices.set(deviceId, client);
      client.join(`user:${payload.sub}`);

      const stats = await this.syncService.getDeviceStats(payload.sub);
      const devices = await this.authService.getUserDevices(payload.sub);

      // Transform current device data to include all needed fields
      const transformedDevice = {
        device_id: device.device_id,
        device_name: device.device_name,
        device_type: device.device_type,
        os_type: device.os_type,
        browser_type: device.browser_type,
        is_active: device.is_active,
        last_active: device.last_active,
        user_id: device.user_id,
      };

      client.emit('init:data', {
        stats,
        devices,
        currentDevice: transformedDevice,
      });
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    try {
      const deviceId = Array.from(this.connectedDevices.entries()).find(
        ([_, socket]) => socket.id === client.id,
      )?.[0];

      if (deviceId) {
        this.connectedDevices.delete(deviceId);
        this.authService.updateDeviceStatus(deviceId, false);

        const rooms = Array.from(client.rooms);
        client.broadcast.to(rooms).emit('device:status', {
          deviceId,
          status: 'offline',
          lastActive: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sync:create')
  async handleSync(
    client: AuthenticatedSocket,
    payload: {
      content: string;
      content_type: ContentType;
      metadata?: Record<string, any>;
      parent_sync_id?: string;
    },
  ) {
    try {
      const userId = client.user.sub;
      const deviceId = client.user.deviceId;

      // Create the new sync
      const syncData = await this.syncService.createSync(
        userId,
        deviceId,
        payload,
      );

      // Get updated lists and stats after creating new sync
      const [recentSyncs, favoriteSyncs, updatedStats] = await Promise.all([
        this.syncService.getRecentSyncs(
          userId,
          deviceId,
          undefined,
          undefined,
          10,
        ),
        this.syncService.getFavoriteSyncs(userId, 5),
        this.syncService.getDeviceStats(userId), // Get updated stats
      ]);

      // Transform sync data
      const transformSync = (sync) => ({
        sync_id: sync.sync_id,
        content: {
          value: sync.content.value,
          timestamp: sync.content.timestamp,
        },
        content_type: sync.content_type,
        source_device_id: sync.source_device_id,
        metadata: sync.metadata,
        created_at: sync.created_at,
        is_favorite: sync.is_favorite || false,
      });

      // Emit to all user's devices including sender
      this.server.to(`user:${userId}`).emit('sync:batch', {
        recent: recentSyncs.map(transformSync),
        favorites: favoriteSyncs.map(transformSync),
        stats: updatedStats, // Include updated stats in the batch
      });

      // Acknowledge successful sync to sender
      client.emit('sync:ack', {
        sync_id: syncData.sync_id,
        status: 'success',
      });
    } catch (error) {
      console.error('Sync creation error:', error);
      client.emit('sync:error', { message: 'Failed to create sync' });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sync:ack')
  async handleSyncAck(
    client: AuthenticatedSocket,
    payload: { sync_id: string },
  ) {
    try {
      const deviceId = client.user.deviceId;

      // Update sync status for the acknowledging device
      await this.syncService.updateSyncStatus(
        payload.sync_id,
        deviceId,
        'COMPLETED',
      );
    } catch (error) {
      console.error('Sync acknowledgment error:', error);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sync:request')
  async handleSyncRequest(
    client: AuthenticatedSocket,
    payload: {
      content_type?: ContentType;
      since?: Date;
      limit?: number;
    },
  ) {
    try {
      const userId = client.user.sub;
      const deviceId = client.user.deviceId;

      // Get both recent and favorite syncs
      const [recentSyncs, favoriteSyncs] = await Promise.all([
        this.syncService.getRecentSyncs(
          userId,
          deviceId,
          payload.content_type,
          payload.since,
          payload.limit,
        ),
        this.syncService.getFavoriteSyncs(userId, 5),
      ]);

      // Transform both sets of data
      const transformSync = (sync) => ({
        sync_id: sync.sync_id,
        content: {
          value: sync.content.value,
          timestamp: sync.content.timestamp,
        },
        content_type: sync.content_type,
        source_device_id: sync.source_device_id,
        metadata: sync.metadata,
        created_at: sync.created_at,
        is_favorite: sync.is_favorite || false,
      });

      const transformedSyncs = {
        recent: recentSyncs.map(transformSync),
        favorites: favoriteSyncs.map(transformSync),
      };

      console.log('Sending transformed syncs:', transformedSyncs);
      client.emit('sync:batch', transformedSyncs);
    } catch (error) {
      console.error('Sync request error:', error);
      client.emit('sync:error', {
        message: 'Failed to fetch syncs',
        error: error.message,
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sync:toggle-favorite')
  async handleToggleFavorite(
    client: AuthenticatedSocket,
    payload: { syncId: string },
  ) {
    try {
      const userId = client.user.sub;
      const isFavorite = await this.syncService.toggleFavorite(
        payload.syncId,
        userId,
      );

      // Get updated lists after toggle
      const [recentSyncs, favoriteSyncs] = await Promise.all([
        this.syncService.getRecentSyncs(
          userId,
          client.user.deviceId,
          undefined,
          undefined,
          10,
        ),
        this.syncService.getFavoriteSyncs(userId, 5),
      ]);

      // Transform and emit updated data
      const transformSync = (sync) => ({
        sync_id: sync.sync_id,
        content: {
          value: sync.content.value,
          timestamp: sync.content.timestamp,
        },
        content_type: sync.content_type,
        source_device_id: sync.source_device_id,
        metadata: sync.metadata,
        created_at: sync.created_at,
        is_favorite: sync.is_favorite || false,
      });

      // Emit to all user's connected devices
      this.server.to(`user:${userId}`).emit('sync:batch', {
        recent: recentSyncs.map(transformSync),
        favorites: favoriteSyncs.map(transformSync),
      });
    } catch (error) {
      console.error('Toggle favorite error:', error);
      client.emit('sync:error', { message: 'Failed to toggle favorite' });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sync:delete')
  async handleDeleteSync(
    client: AuthenticatedSocket,
    payload: { syncId: string },
  ) {
    try {
      const userId = client.user.sub;
      await this.syncService.deleteSync(payload.syncId, userId);

      // Get updated lists after deletion
      const [recentSyncs, favoriteSyncs] = await Promise.all([
        this.syncService.getRecentSyncs(
          userId,
          client.user.deviceId,
          undefined,
          undefined,
          10,
        ),
        this.syncService.getFavoriteSyncs(userId, 5),
      ]);

      // Transform and emit updated data
      const transformSync = (sync) => ({
        sync_id: sync.sync_id,
        content: {
          value: sync.content.value,
          timestamp: sync.content.timestamp,
        },
        content_type: sync.content_type,
        source_device_id: sync.source_device_id,
        metadata: sync.metadata,
        created_at: sync.created_at,
        is_favorite: sync.is_favorite || false,
      });

      // Emit to all user's connected devices
      this.server.to(`user:${userId}`).emit('sync:batch', {
        recent: recentSyncs.map(transformSync),
        favorites: favoriteSyncs.map(transformSync),
      });
    } catch (error) {
      console.error('Delete sync error:', error);
      client.emit('sync:error', { message: 'Failed to delete sync' });
    }
  }

  // Helper method to broadcast to user's devices
  async broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
