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

      client.emit('init:data', {
        stats,
        devices,
        currentDevice: device,
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
  async handleSyncCreate(client: AuthenticatedSocket, payload: SyncPayload) {
    try {
      const userId = client.user.sub;
      const deviceId = client.handshake.auth.deviceId;

      const syncData = await this.syncService.createSync(userId, deviceId, {
        content: payload.content,
        content_type: payload.content_type,
        metadata: payload.metadata,
        parent_sync_id: payload.parent_sync_id,
      });

      // If specific target devices are specified, emit only to them
      if (payload.target_devices?.length) {
        payload.target_devices.forEach((targetDeviceId) => {
          const targetSocket = this.connectedDevices.get(targetDeviceId);
          if (targetSocket) {
            targetSocket.emit('sync:data', {
              sync_id: syncData.sync_id,
              content: syncData.content,
              content_type: syncData.content_type,
              source_device_id: deviceId,
              metadata: syncData.metadata,
            });
          }
        });
      } else {
        // Broadcast to all user's devices except sender
        client.to(`user:${userId}`).emit('sync:data', {
          sync_id: syncData.sync_id,
          content: syncData.content,
          content_type: syncData.content_type,
          source_device_id: deviceId,
          metadata: syncData.metadata,
        });
      }

      // Acknowledge successful sync to sender
      client.emit('sync:ack', {
        sync_id: syncData.sync_id,
        status: 'success',
      });
    } catch (error) {
      console.error('Sync creation error:', error);
      client.emit('sync:error', {
        message: 'Failed to create sync',
        error: error.message,
      });
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

      console.log('Sync request received:', payload);

      // Get recent syncs for the device
      const recentSyncs = await this.syncService.getRecentSyncs(
        userId,
        deviceId,
        payload.content_type,
        payload.since,
        payload.limit,
      );

      console.log('Found syncs:', recentSyncs);

      // Transform the data to match the expected format
      const transformedSyncs = recentSyncs.map((sync) => ({
        sync_id: sync.sync_id,
        content: {
          value: sync.content.value,
          timestamp: sync.content.timestamp,
        },
        content_type: sync.content_type,
        source_device_id: sync.source_device_id,
        metadata: sync.metadata,
        created_at: sync.created_at,
      }));

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

      // Broadcast the update to all user's devices
      this.server.to(`user:${userId}`).emit('sync:favorite-updated', {
        syncId: payload.syncId,
        isFavorite,
      });

      return { success: true, isFavorite };
    } catch (error) {
      console.error('Toggle favorite error:', error);
      client.emit('sync:error', {
        message: 'Failed to toggle favorite',
        error: error.message,
      });
    }
  }

  // Helper method to broadcast to user's devices
  async broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
