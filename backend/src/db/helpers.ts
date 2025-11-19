import { QueryResult, PoolClient } from 'pg';
import pool from './connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function query<T extends Record<string, any> = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;
    logger.query(text, duration, result.rowCount ?? undefined);
    return result;
  } catch (error) {
    logger.error({ type: 'query_error', query: text.substring(0, 100), error });
    throw error;
  }
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function initializeDatabase(): Promise<void> {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);
    logger.info('Database schema initialized');
    
    // Ensure clerk_id column exists (migration for existing databases)
    try {
      await pool.query(`
        DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'users' AND column_name = 'clerk_id'
            ) THEN
                ALTER TABLE users ADD COLUMN clerk_id VARCHAR(255) UNIQUE;
                RAISE NOTICE 'Added clerk_id column to users table';
            END IF;
        END $$;
      `);
      logger.info('Verified clerk_id column exists');
    } catch (migrationError: any) {
      // If column already exists, that's fine
      if (migrationError.code !== '42710' && !migrationError.message?.includes('already exists')) {
        logger.warn({ type: 'migration_warning', error: migrationError });
      }
    }
  } catch (error: any) {
    // Ignore errors if objects already exist (code 42710, 42P07)
    if (error.code === '42710' || error.code === '42P07') {
      logger.info('Database schema already exists, skipping initialization');
      // Still try to add clerk_id column
      try {
        await pool.query(`
          DO $$ 
          BEGIN
              IF NOT EXISTS (
                  SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'users' AND column_name = 'clerk_id'
              ) THEN
                  ALTER TABLE users ADD COLUMN clerk_id VARCHAR(255) UNIQUE;
              END IF;
          END $$;
        `);
        logger.info('Added clerk_id column to existing database');
      } catch (migrationError: any) {
        if (migrationError.code !== '42710' && !migrationError.message?.includes('already exists')) {
          logger.error({ type: 'migration_error', error: migrationError });
        }
      }
    } else {
      logger.error({ type: 'database_init_error', error });
      throw error;
    }
  }
}