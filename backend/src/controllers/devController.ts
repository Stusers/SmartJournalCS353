
import { Request, Response } from 'express';
import pool from '../db/connection.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const resetDatabase = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body; // Optional: Reset only for this user? No, requested "fill the db" implies global reset or user reset. Let's do user specific if possible, but schema reset is global.
    // The user asked to "clear the db". "Clear the db" usually means truncate tables.

    // 1. Drop constraints not needed if we drop tables.

    // 2. Nuke everything (idempotent = won't crash if empty)
    await pool.query(`
      DROP TABLE IF EXISTS journal_entries CASCADE;
      DROP TABLE IF EXISTS user_achievements CASCADE;
      DROP TABLE IF EXISTS user_streaks CASCADE;
      DROP TABLE IF EXISTS daily_prompts CASCADE;
      DROP TABLE IF EXISTS achievements CASCADE;
      -- NOT dropping users table to keep login
    `);

    // 3. Bring it back to life (re-run schema)
    // Use process.cwd() to find src/db/schema.sql reliably in dev mode
    // 3. Re-apply schema
    // Use process.cwd() to find src/db/schema.sql reliably in dev mode
    const schemaPath = path.join(process.cwd(), 'src/db/schema.sql');
    let schema = '';

    if (!fs.existsSync(schemaPath)) {
      // Fallback for production/dist
      const distPath = path.join(__dirname, '../db/schema.sql');
      if (fs.existsSync(distPath)) {
        schema = fs.readFileSync(distPath, 'utf-8');
      } else {
        throw new Error(`Schema file not found at ${schemaPath} or ${distPath}`);
      }
    } else {
      schema = fs.readFileSync(schemaPath, 'utf-8');
    }

    // Execute schema
    await pool.query(schema);

    // 4. Sprinkle some fake data
    const targetUserId = req.userId; // Middleware should populate this

    if (targetUserId) {
      // Seed Entries
      const entries = [];
      const moods = ['Happy', 'Calm', 'Stressed', 'Grateful', 'Productive', 'Tired', 'Energetic'];
      const topics = ['Worked on project', 'Went for a walk', 'Had great coffee', 'Met a friend', 'Read a book', 'Meditation session', 'Coding marathon'];

      const today = new Date();

      for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        // Random number of entries per day (0 to 3)
        const numEntries = Math.floor(Math.random() * 4);

        for (let j = 0; j < numEntries; j++) {
          const mood = moods[Math.floor(Math.random() * moods.length)];
          const text = `Demo entry: ${topics[Math.floor(Math.random() * topics.length)]} and felt ${mood.toLowerCase()}.`;

          // Correctly format array literal for SQL
          entries.push(`(
             ${targetUserId}, 
             '${dateStr}', 
             '${text}', 
             '${mood}', 
             ARRAY['demo', '${mood.toLowerCase()}'], 
             false
           )`);
        }
      }

      if (entries.length > 0) {
        await pool.query(`
          INSERT INTO journal_entries (user_id, entry_date, gratitude_text, mood, tags, is_private)
          VALUES ${entries.join(', ')}
        `);
      }

      // Update streaks
      // Recalculate streak manually or just set it to something static for demo
      await pool.query(`
         INSERT INTO user_streaks (user_id, current_streak, total_entries)
         VALUES (${targetUserId}, 5, ${entries.length})
         ON CONFLICT (user_id) DO UPDATE 
         SET current_streak = 5, total_entries = ${entries.length}
      `);
    }

    res.json({ message: 'Database reset and seeded successfully' });

  } catch (error: any) {
    console.error('Reset failed:', error);
    res.status(500).json({
      error: 'Failed to reset database',
      details: error.message,
      path: path.join(__dirname, '../db/schema.sql') // Debug info
    });
  }
};
