import { CanActivate, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: any): boolean {
    try {
      const client = context.switchToWs().getClient();
      const token = client.handshake.auth.token?.split(' ')[1];

      if (!token) {
        throw new WsException('Unauthorized');
      }

      const payload = this.jwtService.verify(token);
      client.user = payload;

      return true;
    } catch (err) {
      throw new WsException('Unauthorized');
    }
  }
}
