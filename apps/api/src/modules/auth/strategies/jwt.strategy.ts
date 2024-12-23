import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    console.log('JWT Payload:', payload);

    const user = await this.authService.validateUser(payload.sub);
    if (!user) {
      console.log('User validation failed:', payload.sub);
      throw new UnauthorizedException('User not found or inactive');
    }

    if (payload.device_id) {
      console.log(
        'Validating device:',
        payload.device_id,
        'for user:',
        payload.sub,
      );
      const device = await this.authService.validateUserDevice(
        payload.sub,
        payload.device_id,
      );
      if (!device) {
        console.log('Device validation failed. Checking device in database...');
        const deviceInDb = await this.authService.findDeviceById(
          payload.device_id,
        );
        console.log('Device in database:', deviceInDb);
        throw new UnauthorizedException('Invalid device');
      }
    }

    return {
      ...payload,
      user_id: payload.sub,
    };
  }
}
