/**
 * Application-wide constants
 */

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0,
} as const;

// Database Field Names
export const DB_FIELDS = {
  USER_ID: 'user_id',
  ENTRY_DATE: 'entry_date',
  GRATITUDE_TEXT: 'gratitude_text',
  MOOD_RATING: 'mood_rating',
  REFLECTION_TEXT: 'reflection_text',
  TAGS: 'tags',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
} as const;

// Time Constants
export const TIME = {
  MS_PER_SECOND: 1000,
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  MS_PER_DAY: 1000 * 60 * 60 * 24,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INTERNAL_SERVER_ERROR: 'Internal server error',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  INVALID_CREDENTIALS: 'Invalid credentials',
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User already exists',
  ENTRY_NOT_FOUND: 'Journal entry not found',
  ACHIEVEMENT_NOT_FOUND: 'Achievement not found',
  PROMPT_NOT_FOUND: 'Prompt not found',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  PASSWORD_UPDATED: 'Password updated successfully',
  ENTRY_CREATED: 'Journal entry created successfully',
  ENTRY_UPDATED: 'Journal entry updated successfully',
  ENTRY_DELETED: 'Journal entry deleted successfully',
} as const;
