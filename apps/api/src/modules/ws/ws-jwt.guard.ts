import { CanActivate, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  async canActivate(context: any): Promise<boolean> {
    try {
      const client = context.switchToWs().getClient();
      const token = client.handshake.auth.token?.split(' ')[1];
      const deviceId = client.handshake.auth.deviceId;

      if (!token || !deviceId) {
        console.log('[WsGuard] Missing token or deviceId:', {
          hasToken: !!token,
          deviceId,
        });
        throw new WsException('Unauthorized');
      }

      // Verify the token
      const payload = this.jwtService.verify(token);

      // Verify the device exists and belongs to the user
      const device = await this.authService.findDeviceById(deviceId);
      if (!device || device.user_id !== payload.sub) {
        console.log('[WsGuard] Invalid device or user mismatch:', {
          deviceExists: !!device,
          userId: payload.sub,
          deviceUserId: device?.user_id,
        });
        throw new WsException('Unauthorized');
      }

      // Set user data on socket
      client.user = {
        sub: payload.sub,
        email: payload.email,
        deviceId: deviceId,
      };

      return true;
    } catch (err) {
      console.error('[WsGuard] Authorization error:', err);
      throw new WsException('Unauthorized');
    }
  }
}
