
import path from 'path';
import dotenv from 'dotenv';

// Load .env from root (parent of backend)
dotenv.config({ path: path.join(process.cwd(), '../.env') });

import pool from '../db/connection.js';
import fs from 'fs';

async function restore() {
    try {
        console.log('Starting manual restoration...');

        // Use process.cwd() to find schema
        const schemaPath = path.join(process.cwd(), 'src/db/schema.sql');
        console.log('Reading schema from:', schemaPath);

        if (!fs.existsSync(schemaPath)) {
            throw new Error('Schema file not found');
        }

        const schema = fs.readFileSync(schemaPath, 'utf-8');
        console.log('Schema loaded, length:', schema.length);

        await pool.query(schema);
        console.log('Schema executed successfully. Tables should exist.');

        // Verify user_streaks
        const result = await pool.query("SELECT to_regclass('user_streaks')");
        console.log('Verification:', result.rows[0]);

        process.exit(0);
    } catch (e) {
        console.error('Restoration failed:', e);
        process.exit(1);
    }
}

restore();
