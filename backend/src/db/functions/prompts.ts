import { query } from '../helpers.js';
import { DailyPrompt } from '../../types/index.js';

export async function createPrompt(promptText: string, category?: string): Promise<DailyPrompt> {
  const result = await query<DailyPrompt>(
    `INSERT INTO daily_prompts (prompt_text, category)
     VALUES ($1, $2)
     RETURNING *`,
    [promptText, category]
  );

  return result.rows[0];
}

export async function getRandomPrompt(): Promise<DailyPrompt | null> {
  const result = await query<DailyPrompt>(
    'SELECT * FROM daily_prompts ORDER BY RANDOM() LIMIT 1'
  );

  return result.rows[0] || null;
}

export async function getPromptsByCategory(category: string): Promise<DailyPrompt[]> {
  const result = await query<DailyPrompt>(
    'SELECT * FROM daily_prompts WHERE category = $1 ORDER BY RANDOM()',
    [category]
  );

  return result.rows;
}

export async function getAllPrompts(): Promise<DailyPrompt[]> {
  const result = await query<DailyPrompt>(
    'SELECT * FROM daily_prompts ORDER BY created_at DESC'
  );

  return result.rows;
}

export async function deletePrompt(promptId: number): Promise<boolean> {
  const result = await query(
    'DELETE FROM daily_prompts WHERE id = $1',
    [promptId]
  );

  return (result.rowCount ?? 0) > 0;
}
