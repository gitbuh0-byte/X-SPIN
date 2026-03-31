import { createClient, RedisClientType } from 'redis';
import { config } from '../config.js';
import { logger } from './logger.js';

let redisClient: RedisClientType | null = null;

export async function connectRedis(): Promise<RedisClientType> {
  if (redisClient) {
    return redisClient;
  }

  redisClient = createClient({
    url: config.REDIS_URL,
  });

  redisClient.on('error', (err: Error) => logger.error('Redis Client Error', err));
  redisClient.on('connect', () => logger.info('Redis connected'));

  await redisClient.connect();
  return redisClient;
}

export async function getRedis(): Promise<RedisClientType> {
  if (!redisClient) {
    return connectRedis();
  }
  return redisClient;
}

export async function closeRedis() {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
    logger.info('Redis connection closed');
  }
}

// Helper functions for common Redis operations
export async function setCache<T>(
  key: string,
  value: T,
  expirationSeconds?: number
): Promise<void> {
  const client = await getRedis();
  const jsonValue = JSON.stringify(value);
  if (expirationSeconds) {
    await client.setEx(key, expirationSeconds, jsonValue);
  } else {
    await client.set(key, jsonValue);
  }
}

export async function getCache<T>(key: string): Promise<T | null> {
  const client = await getRedis();
  const value = await client.get(key);
  return value ? (JSON.parse(value) as T) : null;
}

export async function deleteCache(key: string): Promise<void> {
  const client = await getRedis();
  await client.del(key);
}

export async function increment(key: string, amount: number = 1): Promise<number> {
  const client = await getRedis();
  return client.incrBy(key, amount);
}

export async function getHash<T extends Record<string, unknown>>(key: string): Promise<T | null> {
  const client = await getRedis();
  const data = await client.hGetAll(key);
  return Object.keys(data).length > 0 ? (data as unknown as T) : null;
}

export async function setHash(key: string, data: Record<string, unknown>): Promise<void> {
  const client = await getRedis();
  const flatData: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    flatData[k] = String(v);
  }
  await client.hSet(key, flatData as any);
}
