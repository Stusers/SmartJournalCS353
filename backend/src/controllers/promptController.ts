import { Request, Response } from 'express';
import * as promptDb from '../db/functions/prompts.js';

export async function createPrompt(req: Request, res: Response) {
  try {
    const { prompt_text, category } = req.body;

    if (!prompt_text) {
      return res.status(400).json({ error: 'Missing prompt_text' });
    }

    const prompt = await promptDb.createPrompt(prompt_text, category);
    res.status(201).json(prompt);
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getRandomPrompt(req: Request, res: Response) {
  try {
    const prompt = await promptDb.getRandomPrompt();

    if (!prompt) {
      return res.status(404).json({ error: 'No prompts available' });
    }

    res.json(prompt);
  } catch (error) {
    console.error('Error fetching random prompt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAllPrompts(req: Request, res: Response) {
  try {
    const prompts = await promptDb.getAllPrompts();
    res.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getPromptsByCategory(req: Request, res: Response) {
  try {
    const category = req.params.category;
    const prompts = await promptDb.getPromptsByCategory(category);
    res.json(prompts);
  } catch (error) {
    console.error('Error fetching prompts by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deletePrompt(req: Request, res: Response) {
  try {
    const promptId = parseInt(req.params.id);
    const success = await promptDb.deletePrompt(promptId);

    if (!success) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
