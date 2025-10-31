import { Request, Response } from 'express';
import * as userDb from '../db/functions/users.js';
import * as streakDb from '../db/functions/streaks.js';
import { asyncHandler, AppError } from '../middleware/errorHandler.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants.js';

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { username, email, password_hash } = req.body;

  if (!username || !email || !password_hash) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.MISSING_REQUIRED_FIELDS);
  }

  const existingUsername = await userDb.getUserByUsername(username);
  if (existingUsername) {
    throw new AppError(HTTP_STATUS.CONFLICT, 'Username already exists');
  }

  const existingEmail = await userDb.getUserByEmail(email);
  if (existingEmail) {
    throw new AppError(HTTP_STATUS.CONFLICT, 'Email already exists');
  }

  const user = await userDb.createUser({ username, email, password_hash });
  await streakDb.initializeUserStreak(user.id);

  const { password_hash: _, ...userWithoutPassword } = user;
  res.status(HTTP_STATUS.CREATED).json(userWithoutPassword);
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  const user = await userDb.getUserById(userId);

  if (!user) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  const { password_hash: _, ...userWithoutPassword } = user;
  res.status(HTTP_STATUS.OK).json(userWithoutPassword);
});

export const updateUserEmail = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  const { email } = req.body;

  if (!email) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Missing email');
  }

  const user = await userDb.updateUserEmail(userId, email);

  if (!user) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  const { password_hash: _, ...userWithoutPassword } = user;
  res.status(HTTP_STATUS.OK).json(userWithoutPassword);
});

export const updateUserPassword = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  const { password_hash } = req.body;

  if (!password_hash) {
    throw new AppError(HTTP_STATUS.BAD_REQUEST, 'Missing password_hash');
  }

  const user = await userDb.updateUserPassword(userId, password_hash);

  if (!user) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  res.status(HTTP_STATUS.OK).json({ message: 'Password updated successfully' });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  const success = await userDb.deleteUser(userId);

  if (!success) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_MESSAGES.USER_NOT_FOUND);
  }

  res.status(HTTP_STATUS.NO_CONTENT).send();
});

export const getUserStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);
  const stats = await streakDb.getUserStats(userId);
  res.status(HTTP_STATUS.OK).json(stats);
});
