import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService {
  private readonly redis: Redis;
  private readonly logger = new Logger('RedisService');

  // TTL constants in seconds
  private readonly TTL = {
    CLIPBOARD: 24 * 60 * 60, // 24 hours
    LINK: 24 * 60 * 60, // 24 hours (increased from 1 hour)
    NOTE: 24 * 60 * 60, // 24 hours (increased from 12 hours)
    FILE_PATH: 7 * 24 * 60 * 60, // 7 days
    RECENT: 24 * 60 * 60, // 24 hours for recent syncs
  };

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: configService.get('REDIS_HOST', 'localhost'),
      port: configService.get('REDIS_PORT', 6379),
      password: configService.get('REDIS_PASSWORD'),
    });
  }

  /**
   * Generate Redis key based on type and IDs
   */
  private generateKey(
    type: string,
    userId: string,
    identifier?: string,
  ): string {
    const key = `sync:${type}:${userId}${identifier ? ':' + identifier : ''}`;
    this.logger.debug(`Generated Redis key: ${key}`);
    return key;
  }

  /**
   * Cache sync data with appropriate TTL
   */
  async cacheSyncData(
    type: 'clipboard' | 'link' | 'note' | 'file',
    userId: string,
    data: any,
    identifier?: string,
  ): Promise<void> {
    try {
      const key = this.generateKey(type, userId, identifier);
      const ttl = this.TTL[type.toUpperCase()] || this.TTL.CLIPBOARD;

      this.logger.debug(`Caching data for key: ${key} with TTL: ${ttl}`);

      await this.redis.set(key, JSON.stringify(data), 'EX', ttl);
    } catch (error) {
      this.logger.error(
        `Error caching sync data: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Cache recent syncs for quick access
   */
  async cacheRecentSyncs(userId: string, syncs: any[]): Promise<void> {
    try {
      const key = this.generateKey('recent', userId);
      this.logger.debug(
        `Caching recent syncs for user ${userId}, count: ${syncs.length}`,
      );

      await this.redis.set(key, JSON.stringify(syncs), 'EX', this.TTL.RECENT);
    } catch (error) {
      this.logger.error(
        `Error caching recent syncs: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Retrieve cached sync data
   */
  async getCachedSync(
    type: string,
    userId: string,
    identifier?: string,
  ): Promise<any | null> {
    try {
      const key = this.generateKey(type, userId, identifier);
      this.logger.debug(`Retrieving cached data for key: ${key}`);

      const data = await this.redis.get(key);
      if (!data) {
        this.logger.debug(`No cached data found for key: ${key}`);
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      this.logger.error(
        `Error retrieving cached sync: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  /**
   * Remove cached item
   */
  async invalidateCache(
    type: string,
    userId: string,
    identifier?: string,
  ): Promise<void> {
    try {
      const key = this.generateKey(type, userId, identifier);
      this.logger.debug(`Invalidating cache for key: ${key}`);
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(
        `Error invalidating cache: ${error.message}`,
        error.stack,
      );
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(
    type: string,
    userId: string,
    identifier?: string,
  ): Promise<boolean> {
    const key = this.generateKey(type, userId, identifier);
    const exists = await this.redis.exists(key);
    this.logger.debug(
      `Cache check for key ${key}: ${exists ? 'exists' : 'does not exist'}`,
    );
    return exists === 1;
  }
}
