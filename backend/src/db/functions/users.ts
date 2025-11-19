import { query } from '../helpers.js';
import { User, CreateUserInput } from '../../types/index.js';

export async function createUser(input: CreateUserInput): Promise<User> {
  const { username, email, password_hash } = input;

  const result = await query<User>(
    `INSERT INTO users (username, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [username, email, password_hash]
  );

  return result.rows[0];
}

export async function getUserById(userId: number): Promise<User | null> {
  const result = await query<User>(
    'SELECT * FROM users WHERE id = $1',
    [userId]
  );

  return result.rows[0] || null;
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const result = await query<User>(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );

  return result.rows[0] || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query<User>(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  return result.rows[0] || null;
}

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  // First check if clerk_id column exists, if not, we'll need to add it
  // For now, we'll try to get by a potential clerk_id field or create a mapping
  const result = await query<User>(
    'SELECT * FROM users WHERE clerk_id = $1',
    [clerkId]
  );

  return result.rows[0] || null;
}

export async function createOrGetUserByClerkId(
  clerkId: string,
  email: string,
  username: string
): Promise<User> {
  // Try to get existing user by Clerk ID
  let user = await getUserByClerkId(clerkId);
  
  if (user) {
    return user;
  }

  // If not found, try to get by email (in case user exists but clerk_id not set)
  user = await getUserByEmail(email);
  
  if (user) {
    // Update existing user with Clerk ID
    const result = await query<User>(
      'UPDATE users SET clerk_id = $1 WHERE id = $2 RETURNING *',
      [clerkId, user.id]
    );
    return result.rows[0];
  }

  // Create new user with Clerk ID
  const result = await query<User>(
    `INSERT INTO users (clerk_id, username, email, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [clerkId, username, email, 'clerk_authenticated'] // No password needed with Clerk
  );

  return result.rows[0];
}

export async function updateUserEmail(userId: number, email: string): Promise<User | null> {
  const result = await query<User>(
    'UPDATE users SET email = $1 WHERE id = $2 RETURNING *',
    [email, userId]
  );

  return result.rows[0] || null;
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<User | null> {
  const result = await query<User>(
    'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING *',
    [passwordHash, userId]
  );

  return result.rows[0] || null;
}

export async function deleteUser(userId: number): Promise<boolean> {
  const result = await query(
    'DELETE FROM users WHERE id = $1',
    [userId]
  );

  return (result.rowCount ?? 0) > 0;
}
