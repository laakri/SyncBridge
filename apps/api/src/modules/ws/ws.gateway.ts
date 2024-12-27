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

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  transports: ['websocket'],
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
      console.log('Client attempting to connect:', client.id);
      const token = client.handshake.auth.token?.split(' ')[1];
      const deviceId = client.handshake.auth.deviceId;

      if (!token || !deviceId) {
        console.log('Missing token or deviceId');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const device = await this.authService.findDeviceById(deviceId);

      if (!device || device.user_id !== payload.sub) {
        console.log('Invalid device or user mismatch');
        client.disconnect();
        return;
      }

      // Set user data on socket
      client.user = {
        sub: payload.sub,
        email: payload.email,
        deviceId: deviceId,
      };

      this.connectedDevices.set(deviceId, client);
      client.join(`user:${payload.sub}`);
      console.log(`Device ${deviceId} connected successfully`);

      // Notify other devices
      client.to(`user:${payload.sub}`).emit('device:online', {
        deviceId,
        deviceName: device.device_name,
      });
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    try {
      const deviceId = Array.from(this.connectedDevices.entries()).find(
        ([_, socket]) => socket.id === client.id,
      )?.[0];

      if (deviceId) {
        console.log(`Device ${deviceId} disconnected`);
        this.connectedDevices.delete(deviceId);

        // Update device status in database
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

      // Get recent syncs for the device
      const recentSyncs = await this.syncService.getRecentSyncs(
        userId,
        deviceId,
        payload.content_type,
        payload.since,
        payload.limit,
      );

      client.emit('sync:batch', recentSyncs);
    } catch (error) {
      console.error('Sync request error:', error);
      client.emit('sync:error', {
        message: 'Failed to fetch syncs',
        error: error.message,
      });
    }
  }

  // Helper method to broadcast to user's devices
  async broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
