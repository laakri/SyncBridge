import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { Inject } from '@nestjs/common';

export type CacheType =
  | 'clipboard'
  | 'link'
  | 'file'
  | 'note'
  | 'favorites'
  | 'recent';

@Injectable()
export class RedisService {
  private readonly logger = new Logger('RedisService');
  private readonly DEFAULT_TTL = 24 * 60 * 60; // 24 hours

  // Hash keys for different data types
  private readonly KEYS = {
    USER_SYNCS: (userId: string) => `user:${userId}:syncs`,
    USER_RECENT: (userId: string) => `user:${userId}:recent`,
    USER_FAVORITES: (userId: string) => `user:${userId}:favorites`,
    USER_STATS: (userId: string) => `user:${userId}:stats`,
  };

  constructor(
    @Inject(Redis)
    private readonly redis: Redis,
  ) {}

  private generateKey(
    type: string,
    userId: string,
    identifier?: string,
  ): string {
    return `sync:${type}:${userId}${identifier ? ':' + identifier : ''}`;
  }

  async set(
    type: CacheType,
    userId: string,
    data: any,
    identifier?: string,
  ): Promise<void> {
    try {
      const key = this.generateKey(type, userId, identifier);
      await this.redis.set(key, JSON.stringify(data), 'EX', this.DEFAULT_TTL);
    } catch (error) {
      this.logger.error(`Redis set error: ${error.message}`);
    }
  }

  async get(
    type: string,
    userId: string,
    identifier?: string,
  ): Promise<any | null> {
    try {
      const key = this.generateKey(type, userId, identifier);
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Redis get error: ${error.message}`);
      return null;
    }
  }

  async delete(
    type: string,
    userId: string,
    identifier?: string,
  ): Promise<void> {
    try {
      const key = this.generateKey(type, userId, identifier);
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Redis delete error: ${error.message}`);
    }
  }

  async batchSet(
    operations: {
      type: CacheType;
      userId: string;
      data: any;
      identifier?: string;
    }[],
  ): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();

      operations.forEach((op) => {
        const key = this.generateKey(op.type, op.userId, op.identifier);
        pipeline.set(key, JSON.stringify(op.data), 'EX', this.DEFAULT_TTL);
      });

      await pipeline.exec();
    } catch (error) {
      this.logger.error(`Redis batch set error: ${error.message}`);
    }
  }

  async addSync(userId: string, sync: any): Promise<void> {
    const pipeline = this.redis.pipeline();

    // Store sync in hash
    pipeline.hset(
      this.KEYS.USER_SYNCS(userId),
      sync.sync_id,
      JSON.stringify(sync),
    );

    // Add to sorted set for recent syncs
    pipeline.zadd(
      this.KEYS.USER_RECENT(userId),
      sync.created_at.getTime(),
      sync.sync_id,
    );

    // Update stats
    pipeline.hincrby(this.KEYS.USER_STATS(userId), sync.content_type, 1);

    await pipeline.exec();
  }

  async getRecentSyncs(userId: string, limit: number = 10): Promise<any[]> {
    try {
      const pipeline = this.redis.pipeline();

      // Get recent sync IDs with timeout
      const syncIds = (await Promise.race([
        this.redis.zrevrange(this.KEYS.USER_RECENT(userId), 0, limit - 1),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Redis operation timed out')),
            5000,
          ),
        ),
      ])) as string[];

      if (!syncIds.length) return [];

      // Get sync data from hash
      const syncs = await Promise.race([
        this.redis.hmget(this.KEYS.USER_SYNCS(userId), ...syncIds),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Redis operation timed out')),
            5000,
          ),
        ),
      ]);
      return (syncs as string[])
        .filter((sync) => sync != null)
        .map((sync) => JSON.parse(sync));
    } catch (error) {
      this.logger.error(`Redis getRecentSyncs error: ${error.message}`);
      return []; // Return empty array as fallback
    }
  }
}
