import { Pool, QueryResult } from 'pg';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err: Error) => {
  logger.error('Unexpected error on idle client', err);
});

export async function connectDatabase() {
  try {
    const client = await pool.connect();
    logger.info('PostgreSQL connected successfully');
    client.release();
  } catch (err) {
    logger.error('Failed to connect to PostgreSQL:', err);
    throw err;
  }
}

export async function closeDatabase() {
  await pool.end();
  logger.info('PostgreSQL connection pool closed');
}

export const query = (text: string, params?: unknown[]) => {
  return pool.query(text, params);
};
