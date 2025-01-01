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
          retryStrategy: (times) => Math.min(times * 50, 2000),
          connectTimeout: 10000,
          maxRetriesPerRequest: 3,
          enableReadyCheck: false,
          showFriendlyErrorStack: true,
          lazyConnect: true,
          commandTimeout: 5000,
          keepAlive: 5000,
          db: 0,
        });

        redis.on('error', (err) => {
          console.error('Redis connection error:', err);
        });

        redis.on('connect', () => {
          console.log('Successfully connected to Redis');
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
