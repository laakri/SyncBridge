import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private authService: AuthService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    try {
      const canActivate = await super.canActivate(context);
      return canActivate as boolean;
    } catch (error) {
      console.log('🔒 JWT Guard - Error type:', error.name);
      console.log('🔒 JWT Guard - Error message:', error.message);

      if (error.name === 'TokenExpiredError') {
        console.log('🔄 Token expired, attempting refresh...');
        const refreshToken = request.headers['refresh-token'];
        const deviceId = request.headers['device-id'];

        console.log('🔑 Refresh attempt with:', {
          refreshToken: refreshToken?.slice(-10),
          deviceId,
        });

        if (!refreshToken || !deviceId) {
          throw new UnauthorizedException('Authentication required');
        }

        try {
          const tokens = await this.authService.refreshTokens(
            refreshToken,
            deviceId,
          );
          console.log('✅ Token refresh successful');

          // Set new tokens in response headers
          response.header('new-access-token', tokens.access_token);
          response.header('new-refresh-token', tokens.refresh_token);

          // Update request authorization
          request.headers.authorization = `Bearer ${tokens.access_token}`;

          // Retry the authentication
          return super.canActivate(context) as boolean;
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          throw new UnauthorizedException('Token refresh failed');
        }
      }
      throw error;
    }
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw (
        err || new UnauthorizedException('Invalid token or no token provided')
      );
    }
    return user;
  }
}
