import { Request, Response } from 'express';
import * as userDb from '../db/functions/users.js';
import * as streakDb from '../db/functions/streaks.js';

export async function createUser(req: Request, res: Response) {
  try {
    const { username, email, password_hash } = req.body;

    if (!username || !email || !password_hash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingUsername = await userDb.getUserByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const existingEmail = await userDb.getUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const user = await userDb.createUser({ username, email, password_hash });
    await streakDb.initializeUserStreak(user.id);

    const { password_hash: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    const user = await userDb.getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password_hash: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUserEmail(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    const user = await userDb.updateUserEmail(userId, email);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password_hash: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user email:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUserPassword(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    const { password_hash } = req.body;

    if (!password_hash) {
      return res.status(400).json({ error: 'Missing password_hash' });
    }

    const user = await userDb.updateUserPassword(userId, password_hash);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating user password:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    const success = await userDb.deleteUser(userId);

    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUserStats(req: Request, res: Response) {
  try {
    const userId = parseInt(req.params.id);
    const stats = await streakDb.getUserStats(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
