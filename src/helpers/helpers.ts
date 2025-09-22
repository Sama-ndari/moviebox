import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { createClient, RedisClientType, commandOptions } from '@redis/client';

export interface ResponseWrapper<T> {
  statusCode: number;
  message: string;
  success: boolean;
  data: T;
  meta: {
    timestamp: string;
  };
}

export class CommonHelpers {
  private static readonly logger = new Logger(CommonHelpers.name);
  static readonly MAX_RETRIES = 5;
  static readonly DEFAULT_TTL = 300; // 5 minutes
  private static redisClient: RedisClientType;
  private static config: any;

  static initialize(config: any): void {
    this.config = config;
  }

  static async initializeRedisClient(): Promise<RedisClientType> {
    if (!this.redisClient) {
      if (!this.config || !this.config.redis) {
        throw new Error('Redis config not initialized in CommonHelpers');
      }

      this.logger.log(
        `Initializing Redis client: ${this.config.redis.host}:${this.config.redis.port}`,
      );
      this.redisClient = createClient({
        url: `redis://${this.config.redis.host}:${this.config.redis.port}`,
      });

      try {
        await this.redisClient.connect();
        this.logger.log(
          `Connected to Redis successfully: ${this.config.redis.host}:${this.config.redis.port}`,
        );
      } catch (err) {
        this.logger.error('Failed to connect to Redis:', err.message);
        throw new HttpException(
          'Redis connection failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      process.on('SIGINT', async () => {
        if (this.redisClient) {
          await this.redisClient.quit();
          this.logger.log('Redis client disconnected');
        }
        process.exit(0);
      });
    }
    return this.redisClient;
  }

  static async retry<T>(operation: () => Promise<T>): Promise<T> {
    let attempt = 0;
    while (attempt < this.MAX_RETRIES) {
      try {
        this.logger.log(`Attempt ${attempt + 1}`);
        return await operation();
      } catch (error) {
        attempt++;
        this.logger.error(`Attempt ${attempt} failed: ${error.message}`);
        if (!(error.code && error.code === 'ECONNRESET')) {
          throw error;
        }
        if (attempt === this.MAX_RETRIES) {
          throw new HttpException(
            `Operation failed after ${this.MAX_RETRIES} attempts: ${error.message}`,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }
    throw new HttpException(
      'Unexpected error in retry logic',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  static async cacheOrFetch<T>(
    cacheKey: string,
    fetchFn: () => Promise<T>,
    ttl: number = this.DEFAULT_TTL,
    setName?: string,
  ): Promise<T> {
    const redis = await this.initializeRedisClient();
    if (!redis.isOpen) {
      this.logger.warn(`Redis not connected; skipping cache for ${cacheKey}`);
      return this.retry(fetchFn);
    }
    try {
      const cachedData = await redis.get(cacheKey);
      this.logger.log(`Cache lookup for ${cacheKey}:`, cachedData ? 'Hit' : 'Miss');
      if (cachedData) {
        try {
          return JSON.parse(cachedData) as T;
        } catch (parseError) {
          this.logger.error(
            `Invalid cache data for ${cacheKey}: ${parseError.message}`,
          );
        }
      }

      const data = await this.retry(fetchFn);
      try {
        await redis.set(cacheKey, JSON.stringify(data), { EX: ttl });
        this.logger.log(`Setting cache for ${cacheKey} with TTL: ${ttl}s`);

        if (setName) {
          await redis.sAdd(setName, cacheKey);
          this.logger.log(`Added ${cacheKey} to set: ${setName}`);
        }
      } catch (cacheSetError) {
        this.logger.error(
          `Failed to set cache for ${cacheKey}: ${cacheSetError.message}`,
        );
      }
      return data;
    } catch (error) {
      this.logger.error(`Cache error for ${cacheKey}: ${error.message}`);
      return this.retry(fetchFn);
    }
  }

  static async invalidateCache(cacheKeys: string[]): Promise<void> {
    const redis = await this.initializeRedisClient();
    if (!redis.isOpen) {
      this.logger.warn('Redis not connected; skipping cache invalidation');
      return;
    }

    if (cacheKeys.length === 0) {
      return;
    }
    try {
      await redis.del(cacheKeys);
      this.logger.log(
        `Invalidated ${cacheKeys.length} keys: ${cacheKeys.join(', ')}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to invalidate cache for keys: ${cacheKeys.join(', ')} - ${error.message}`,
      );
    }
  }

  static async invalidateCacheByPattern(pattern: string): Promise<void> {
    const redis = await this.initializeRedisClient();
    if (!redis.isOpen) {
      this.logger.warn('Redis not connected; skipping cache invalidation');
      return;
    }
    try {
      let cursor = 0;
      let totalKeysDeleted = 0;

      do {
        const scanResult = await redis.scan(cursor, {
          MATCH: pattern,
          COUNT: 100,
        });

        cursor = scanResult.cursor;
        const keys = scanResult.keys;

        if (keys.length > 0) {
          await redis.del(keys);
          totalKeysDeleted += keys.length;
          this.logger.log(
            `Deleted ${keys.length} keys matching pattern: ${pattern}`,
          );
        }
      } while (cursor !== 0);

      this.logger.log(
        `Invalidated ${totalKeysDeleted} keys for pattern: ${pattern}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to invalidate cache for pattern: ${pattern} - ${error.message}`,
      );
    }
  }

  static transformDocument(document: any): any {
    return { ...document, _id: document._id.toString() };
  }

}
