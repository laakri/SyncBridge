import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { RedisService } from './redis.service';
import { Configuration } from '../../config/configuration';

@Module({
  providers: [
    {
      provide: Redis,
      useFactory: (configService: ConfigService<Configuration>) => {
        const redisConfig = configService.get('redis');

        const redis = new Redis({
          ...redisConfig,
          retryStrategy: (times) => {
            const delay = Math.min(times * redisConfig.retryDelay, 3000);
            return times <= redisConfig.maxRetryAttempts ? delay : null;
          },
          reconnectOnError: (err) => {
            return err.message.includes('READONLY');
          },
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
