import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './ws-jwt.guard';

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

  private connectedDevices = new Map<string, Socket>();

  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  async handleConnection(client: Socket) {
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

  handleDisconnect(client: Socket) {
    try {
      const deviceId = Array.from(this.connectedDevices.entries()).find(
        ([_, socket]) => socket.id === client.id,
      )?.[0];

      if (deviceId) {
        console.log(`Device ${deviceId} disconnected`);
        this.connectedDevices.delete(deviceId);
        const rooms = Array.from(client.rooms);
        client.broadcast.to(rooms).emit('device:offline', { deviceId });
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sync:request')
  handleSyncRequest(client: Socket, payload: any) {
    try {
      const userRoom = Array.from(client.rooms).find((room) =>
        room.startsWith('user:'),
      );
      if (userRoom) {
        client.to(userRoom).emit('sync:request', payload);
      }
    } catch (error) {
      console.error('Sync request error:', error);
    }
  }

  // Helper method to broadcast to user's devices
  async broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
