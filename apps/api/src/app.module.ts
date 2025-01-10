import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configuration, Configuration } from './config/configuration';
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
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    RedisModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (
        configService: ConfigService<Configuration>,
      ): Promise<TypeOrmModuleOptions> => {
        const dbConfig = configService.get('database');
        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.name,
          synchronize: dbConfig.synchronize,
          entities: [
            User,
            Device,
            DeviceAuthentication,
            SecurityEvent,
            SyncStatus,
            SyncData,
          ],
          logging: process.env.NODE_ENV !== 'production',
        };
      },
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
