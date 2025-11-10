// Migration script to add clerk_id column
// Run with: npx tsx src/db/migrate-clerk-id.ts

import 'dotenv/config';
import pool from './connection.js';

async function migrate() {
  try {
    console.log('Checking for clerk_id column...');
    
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'clerk_id'
    `);
    
    if (result.rows.length > 0) {
      console.log('✓ clerk_id column already exists');
    } else {
      console.log('Adding clerk_id column...');
      await pool.query(`
        ALTER TABLE users ADD COLUMN clerk_id VARCHAR(255) UNIQUE;
      `);
      console.log('✓ clerk_id column added successfully');
    }
    
    process.exit(0);
  } catch (error: any) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();

