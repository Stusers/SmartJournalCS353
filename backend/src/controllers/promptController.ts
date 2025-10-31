import { Request, Response } from 'express';
import * as promptDb from '../db/functions/prompts.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';

export const createPrompt = asyncHandler(async (req: Request, res: Response) => {
  const { prompt_text, category } = req.body;

  if (!prompt_text) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Missing prompt_text');
  }

  const prompt = await promptDb.createPrompt(prompt_text, category);
  res.status(HTTP_STATUS.CREATED).json(prompt);
});

export const getRandomPrompt = asyncHandler(async (req: Request, res: Response) => {
  const prompt = await promptDb.getRandomPrompt();

  if (!prompt) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, 'No prompts available');
  }

  res.status(HTTP_STATUS.OK).json(prompt);
});

export const getAllPrompts = asyncHandler(async (req: Request, res: Response) => {
  const prompts = await promptDb.getAllPrompts();
  res.status(HTTP_STATUS.OK).json(prompts);
});

export const getPromptsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const category = req.params.category;
  const prompts = await promptDb.getPromptsByCategory(category);
  res.status(HTTP_STATUS.OK).json(prompts);
});

export const deletePrompt = asyncHandler(async (req: Request, res: Response) => {
  const promptId = parseInt(req.params.id);
  const success = await promptDb.deletePrompt(promptId);

  if (!success) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.PROMPT_NOT_FOUND);
  }

  res.status(HTTP_STATUS.NO_CONTENT).send();
});
