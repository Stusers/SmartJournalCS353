import { Pool } from 'pg';
import { logger } from '../utils/logger.js';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'gratitude_journal',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Handle pool errors
    pool.on('error', (err) => {
      logger.error({
        type: 'pool_error',
        message: 'Unexpected error on idle client',
        error: err.message,
        stack: err.stack,
      });
    });
  }
  return pool;
}

export async function testConnection(): Promise<boolean> {
  try {
    const poolInstance = getPool();
    const client = await poolInstance.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connected successfully');
    return true;
  } catch (error: any) {
    logger.error({
      type: 'connection_test_failed',
      message: 'Database connection failed',
      error: error.message,
      code: error.code,
      detail: error.detail,
    });
    return false;
  }
}

export async function closePool(): Promise<void> {
  try {
    if (pool) {
      await pool.end();
      pool = null;
      logger.info('Database pool closed');
    }
  } catch (error: any) {
    logger.error({
      type: 'pool_close_error',
      message: 'Error closing database pool',
      error: error.message,
    });
    throw error;
  }
}

// Export a proxy object that delegates to the lazy-initialized pool
export default new Proxy({} as Pool, {
  get(_target, prop) {
    const poolInstance = getPool();
    const value = (poolInstance as any)[prop];
    if (typeof value === 'function') {
      return value.bind(poolInstance);
    }
    return value;
  }
});