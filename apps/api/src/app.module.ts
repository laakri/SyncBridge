import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { User } from './entities/user.entity';
import { Device } from './entities/device.entity';
import { SecurityEvent } from './entities/security-event.entity';
import { SyncStatus } from './entities/sync-status.entity';
import { SyncData } from './entities/sync-data.entity';
import { DeviceAuthentication } from './entities/device-auth.entity';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { WsModule } from './modules/ws/ws.module';
import { DevicesModule } from './modules/devices/devices.module';
import { ProfileModule } from './modules/profile/profile.module';
import { RedisModule } from './modules/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_NAME', 'syncbridge'),
        entities: [
          User,
          Device,
          DeviceAuthentication,
          SecurityEvent,
          SyncStatus,
          SyncData,
        ],
        synchronize: configService.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    WsModule,
    AuthModule,
    DevicesModule,
    ProfileModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
