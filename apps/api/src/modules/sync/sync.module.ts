import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SyncData } from '../../entities/sync-data.entity';
import { SyncStatus } from '../../entities/sync-status.entity';
import { Device } from '../../entities/device.entity';
import { WsModule } from '../ws/ws.module';
import { AuthModule } from '../auth/auth.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SyncData, SyncStatus, Device]),
    forwardRef(() => WsModule),
    AuthModule,
    RedisModule,
  ],
  controllers: [SyncController],
  providers: [SyncService],
  exports: [SyncService],
})
export class SyncModule {}
