import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { RedisService } from './redis.service';

@Module({
  providers: [
    {
      provide: Redis,
      useFactory: (configService: ConfigService) => {
        const redis = new Redis({
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
          password: configService.get('REDIS_PASSWORD'),
          retryStrategy: (times) => {
            const delay = Math.min(times * 100, 3000);
            return delay;
          },
          maxRetriesPerRequest: 5,
          connectTimeout: 20000,
          commandTimeout: 10000,
          keepAlive: 10000,
          enableReadyCheck: true,
          enableOfflineQueue: true,
          reconnectOnError: (err) => {
            const targetError = 'READONLY';
            if (err.message.includes(targetError)) {
              return true;
            }
            return false;
          },
          db: 0,
        });

        redis.on('error', (err) => {
          console.error('Redis connection error:', err);
        });

        redis.on('connect', () => {
          console.log('Successfully connected to Redis');
        });

        redis.on('ready', () => {
          console.log('Redis client ready');
        });

        redis.on('reconnecting', () => {
          console.log('Redis client reconnecting');
        });

        return redis;
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: [Redis, RedisService],
})
export class RedisModule {}
