# SmartJournal Backend Documentation

## Overview
SmartJournal is a mindfulness and wellbeing journaling application backend built with Node.js, Express, TypeScript, and PostgreSQL. The backend provides RESTful API endpoints for managing users, journal entries, achievements, daily prompts, and user streaks.

**Project Team:** Stanislav Ustinov, Rachel Bermingham, Darragh Brean McCormack, Oluwashina Taofeek Ojumide Anafi, Dawid Makary Dulik, Franklin Asare, and Anthony Enkhtur - Third Year Computer Science and Software Engineering Students at Maynooth University.

---

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Database Architecture](#database-architecture)
4. [API Endpoints](#api-endpoints)
5. [Core Features](#core-features)
6. [Middleware](#middleware)
7. [Error Handling](#error-handling)
8. [Logging System](#logging-system)
9. [Configuration](#configuration)
10. [Setup and Installation](#setup-and-installation)

---

## Technology Stack

### Core Technologies
- **Runtime:** Node.js
- **Framework:** Express.js 4.18.2
- **Language:** TypeScript 5.9.3
- **Database:** PostgreSQL (via pg 8.11.3)
- **Process Manager:** tsx (for development with watch mode)

### Key Dependencies
- **cors:** Cross-Origin Resource Sharing support
- **dotenv:** Environment variable management
- **pg:** PostgreSQL client for Node.js

### Development Tools
- **tsx:** TypeScript execution and watch mode
- **ts-node:** TypeScript execution
- **TypeScript:** Static type checking

---

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── constants.ts          # Application-wide constants
│   ├── controllers/
│   │   ├── achievementController.ts  # Achievement business logic
│   │   ├── journalController.ts      # Journal entry operations
│   │   ├── promptController.ts       # Daily prompt management
│   │   └── userController.ts         # User management
│   ├── db/
│   │   ├── connection.ts         # PostgreSQL connection pool
│   │   ├── helpers.ts            # Database query helpers
│   │   ├── schema.sql            # Database schema definition
│   │   └── functions/
│   │       ├── achievements.ts   # Achievement database operations
│   │       ├── journalEntries.ts # Journal entry database operations
│   │       ├── prompts.ts        # Prompt database operations
│   │       ├── streaks.ts        # Streak calculation operations
│   │       └── users.ts          # User database operations
│   ├── middleware/
│   │   ├── errorHandler.ts      # Global error handling
│   │   └── requestLogger.ts     # HTTP request logging
│   ├── routes/
│   │   ├── achievementRoutes.ts # Achievement API routes
│   │   ├── journalRoutes.ts     # Journal API routes
│   │   ├── promptRoutes.ts      # Prompt API routes
│   │   └── userRoutes.ts        # User API routes
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── utils/
│   │   └── logger.ts            # Structured logging utility
│   └── index.ts                 # Application entry point
├── .env                         # Environment variables (not in repo)
├── .env.example                 # Environment variables template
├── package.json                 # Dependencies and scripts
└── tsconfig.json                # TypeScript configuration
```

**File Reference:** `backend/src/index.ts:1-101`

---

## Database Architecture

### Database Schema
The application uses PostgreSQL with a well-structured relational schema.

**File Reference:** `backend/src/db/schema.sql:1-99`

### Tables

#### 1. Users Table
Stores user account information.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Fields:**
- `id`: Auto-incrementing primary key
- `username`: Unique username
- `email`: Unique email address
- `password_hash`: Hashed password (security best practice)
- `created_at`, `updated_at`: Automatic timestamps

**File Reference:** `backend/src/db/schema.sql:4-11`

#### 2. Journal Entries Table
Stores daily journal entries with gratitude reflections.

```sql
CREATE TABLE journal_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    gratitude_text TEXT NOT NULL,
    mood VARCHAR(50),
    tags TEXT[],
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, entry_date)
)
```

**Fields:**
- `id`: Primary key
- `user_id`: Foreign key to users table
- `entry_date`: Date of the journal entry
- `gratitude_text`: Main content of the entry
- `mood`: Optional mood indicator (e.g., "happy", "calm", "stressed")
- `tags`: Array of tags for categorization
- `is_private`: Privacy flag for the entry
- **Constraint:** One entry per user per day (UNIQUE constraint)

**File Reference:** `backend/src/db/schema.sql:14-25`

#### 3. User Streaks Table
Tracks user consistency and engagement metrics.

```sql
CREATE TABLE user_streaks (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    total_entries INTEGER DEFAULT 0,
    last_entry_date DATE,
    streak_freeze_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Fields:**
- `user_id`: Primary key and foreign key to users
- `current_streak`: Current consecutive days with entries
- `longest_streak`: Longest streak ever achieved
- `total_entries`: Total number of entries created
- `last_entry_date`: Date of the most recent entry
- `streak_freeze_count`: Number of streak freezes available

**File Reference:** `backend/src/db/schema.sql:28-36`

#### 4. Achievements Table
Defines available achievements/badges in the system.

```sql
CREATE TABLE achievements (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    requirement_type VARCHAR(50),
    requirement_value INTEGER
)
```

**Predefined Achievements:**
1. **First Entry** - Complete your first gratitude entry (1 entry)
2. **Week Warrior** - Maintain a 7-day streak
3. **Month Master** - Maintain a 30-day streak
4. **Gratitude Guru** - Complete 100 entries
5. **Consistent Creator** - Maintain a 100-day streak
6. **Year of Gratitude** - Maintain a 365-day streak

**File Reference:** `backend/src/db/schema.sql:39-46`, `backend/src/db/schema.sql:90-98`

#### 5. User Achievements Table
Junction table tracking which users earned which achievements.

```sql
CREATE TABLE user_achievements (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    achievement_id INTEGER REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, achievement_id)
)
```

**File Reference:** `backend/src/db/schema.sql:49-54`

#### 6. Daily Prompts Table
Stores journaling prompts to inspire users.

```sql
CREATE TABLE daily_prompts (
    id SERIAL PRIMARY KEY,
    prompt_text TEXT NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**File Reference:** `backend/src/db/schema.sql:57-62`

### Database Indexes
Performance-optimized indexes are created for common query patterns:

```sql
CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, entry_date DESC);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_date ON journal_entries(entry_date);
CREATE INDEX idx_user_streaks_user_id ON user_streaks(user_id);
```

**File Reference:** `backend/src/db/schema.sql:65-68`

### Database Triggers
Automatic timestamp updates using PostgreSQL triggers:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';
```

**File Reference:** `backend/src/db/schema.sql:71-77`

### Connection Management
The application uses a PostgreSQL connection pool with the following configuration:

```typescript
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'gratitude_journal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,                        // Maximum pool size
  idleTimeoutMillis: 30000,       // Close idle connections after 30s
  connectionTimeoutMillis: 2000,  // Connection timeout 2s
});
```

**File Reference:** `backend/src/db/connection.ts:4-13`

---

## API Endpoints

The backend provides RESTful API endpoints organized by resource type. All endpoints are prefixed with `/api`.

### Health Check
**Purpose:** Monitor server status and uptime.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Returns server status, timestamp, and uptime |

**Response Example:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-19T12:00:00.000Z",
  "uptime": 3600.25
}
```

**File Reference:** `backend/src/index.ts:29-35`

---

### User Management Endpoints

**File Reference:** `backend/src/routes/userRoutes.ts:1-13`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| POST | `/api/users` | Create new user account | `createUser` |
| GET | `/api/users/:id` | Get user by ID | `getUserById` |
| PUT | `/api/users/:id/email` | Update user email | `updateUserEmail` |
| PUT | `/api/users/:id/password` | Update user password | `updateUserPassword` |
| DELETE | `/api/users/:id` | Delete user account | `deleteUser` |
| GET | `/api/users/:id/stats` | Get user statistics | `getUserStats` |

**User Statistics Response:**
```typescript
{
  total_entries: number,
  current_streak: number,
  longest_streak: number,
  achievements_earned: number,
  entries_this_week: number,
  entries_this_month: number
}
```

**File Reference:** `backend/src/types/index.ts:84-91`

---

### Journal Entry Endpoints

**File Reference:** `backend/src/routes/journalRoutes.ts:1-17`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| POST | `/api/entries` | Create a new journal entry | `createEntry` |
| GET | `/api/entries/:id` | Get specific entry by ID | `getEntryById` |
| PUT | `/api/entries/:id` | Update existing entry | `updateEntry` |
| DELETE | `/api/entries/:id` | Delete an entry | `deleteEntry` |
| GET | `/api/users/:userId/entries` | Get all entries for a user (with pagination) | `getUserEntries` |
| GET | `/api/users/:userId/entries/range` | Get entries within a date range | `getEntriesByDateRange` |
| GET | `/api/users/:userId/entries/search` | Search entries by text | `searchEntries` |
| GET | `/api/users/:userId/entries/tag/:tag` | Get entries by tag | `getEntriesByTag` |
| GET | `/api/users/:userId/entries/mood/:mood` | Get entries by mood | `getEntriesByMood` |

**Create Entry Request Body:**
```typescript
{
  user_id: number,
  entry_date: string,      // ISO date string
  gratitude_text: string,
  mood?: string,
  tags?: string[],
  is_private?: boolean
}
```

**Create Entry Response:**
```typescript
{
  entry: JournalEntry,
  new_achievements: Achievement[]  // Newly earned achievements
}
```

**File Reference:** `backend/src/controllers/journalController.ts:8-36`

**Entry Search Query Parameters:**
- `q`: Search term (required)
- `limit`: Maximum results (default: 50)

**Date Range Query Parameters:**
- `start_date`: Start date (ISO string, required)
- `end_date`: End date (ISO string, required)

**File Reference:** `backend/src/controllers/journalController.ts:58-73`

---

### Achievement Endpoints

**File Reference:** `backend/src/routes/achievementRoutes.ts:1-10`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| GET | `/api/achievements` | Get all available achievements | `getAllAchievements` |
| GET | `/api/users/:userId/achievements` | Get achievements earned by user | `getUserAchievements` |
| GET | `/api/users/:userId/achievements/progress` | Get achievement progress for user | `getUserAchievementProgress` |

**Achievement Progress Response:**
```typescript
{
  ...achievement,
  earned: boolean,
  progress: number,        // Percentage (0-100)
  current_value: number,   // Current user progress
  required_value: number   // Target value
}
```

**File Reference:** `backend/src/db/functions/achievements.ts:119-140`

---

### Daily Prompt Endpoints

**File Reference:** `backend/src/routes/promptRoutes.ts:1-12`

| Method | Endpoint | Description | Controller |
|--------|----------|-------------|------------|
| POST | `/api/prompts` | Create a new prompt | `createPrompt` |
| GET | `/api/prompts` | Get all prompts | `getAllPrompts` |
| GET | `/api/prompts/random` | Get a random prompt | `getRandomPrompt` |
| GET | `/api/prompts/category/:category` | Get prompts by category | `getPromptsByCategory` |
| DELETE | `/api/prompts/:id` | Delete a prompt | `deletePrompt` |

---

## Core Features

### 1. Journal Entry Management

**Creation with Side Effects:**
When a journal entry is created, several automatic processes occur:

1. **Duplicate Prevention:** Check if entry already exists for that date
2. **Entry Creation:** Insert the journal entry into the database
3. **Streak Update:** Automatically update user's streak statistics
4. **Achievement Check:** Evaluate and grant any newly earned achievements

**File Reference:** `backend/src/controllers/journalController.ts:8-36`

**Key Controller Functions:**
```typescript
export const createEntry = asyncHandler(async (req: Request, res: Response) => {
  // 1. Validate required fields
  // 2. Check for existing entry on same date
  // 3. Create journal entry
  // 4. Update user streak
  // 5. Check and grant achievements
  // 6. Return entry and new achievements
});
```

---

### 2. Streak System

The streak system tracks user consistency in journaling.

**Streak Calculation Logic:**
- **Current Streak:** Consecutive days with entries (breaks if a day is missed)
- **Longest Streak:** Historical record of longest consecutive period
- **Total Entries:** Lifetime count of all journal entries
- **Streak Freeze:** Mechanism to protect streaks (not yet implemented)

**Streak Update Process:**
```typescript
await streakDb.updateStreakAfterEntry(user_id, new Date(entry_date));
```

**File Reference:** `backend/src/controllers/journalController.ts:29`

**Database Function:** `backend/src/db/functions/streaks.ts`

---

### 3. Achievement System

**Achievement Types:**
1. **Streak-based:** Earned by maintaining consecutive day streaks
2. **Total entries-based:** Earned by reaching milestone entry counts

**Achievement Granting Process:**

```typescript
export async function checkAndGrantAchievements(userId: number): Promise<Achievement[]> {
  // 1. Get all achievements in system
  // 2. Get user's already earned achievements
  // 3. Get user's current statistics
  // 4. Check each unearned achievement for qualification
  // 5. Grant newly qualified achievements
  // 6. Return list of newly earned achievements
}
```

**File Reference:** `backend/src/db/functions/achievements.ts:95-117`

**Achievement Progress Tracking:**
The system calculates progress toward unearned achievements as a percentage:

```typescript
const progress = Math.min((currentValue / requirement_value) * 100, 100);
```

**File Reference:** `backend/src/db/functions/achievements.ts:91`

---

### 4. Search and Filtering

Users can search and filter journal entries by multiple criteria:

**Search by Text:**
Full-text search across gratitude_text field.

**Filter by Tag:**
Retrieve entries containing a specific tag.

**Filter by Mood:**
Retrieve entries matching a mood state.

**Date Range Queries:**
Retrieve entries between two dates (useful for reports/analytics).

**Pagination:**
All list endpoints support `limit` and `offset` parameters.

**Default Pagination Values:**
```typescript
export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  DEFAULT_OFFSET: 0,
}
```

**File Reference:** `backend/src/config/constants.ts:19-23`

---

## Middleware

### 1. Request Logger Middleware

Logs all incoming HTTP requests with timing information.

**File Reference:** `backend/src/middleware/requestLogger.ts`

**Applied globally:** `backend/src/index.ts:20`

```typescript
app.use(requestLogger);
```

---

### 2. Error Handler Middleware

Provides centralized error handling for the entire application.

**File Reference:** `backend/src/middleware/errorHandler.ts:1-78`

**Custom Error Class:**
```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}
```

**Usage in Controllers:**
```typescript
if (!user_id || !entry_date || !gratitude_text) {
  throw new AppError(HTTP_STATUS.BAD_REQUEST, ERROR_MESSAGES.MISSING_REQUIRED_FIELDS);
}
```

**File Reference:** `backend/src/controllers/journalController.ts:11-12`

**Async Handler Wrapper:**
Automatically catches errors in async route handlers and passes them to error middleware.

```typescript
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

**File Reference:** `backend/src/middleware/errorHandler.ts:22-26`

---

### 3. CORS Middleware

Enables Cross-Origin Resource Sharing for frontend integration.

```typescript
app.use(cors());
```

**File Reference:** `backend/src/index.ts:18`

---

### 4. JSON Body Parser

Parses incoming JSON request bodies.

```typescript
app.use(express.json());
```

**File Reference:** `backend/src/index.ts:19`

---

## Error Handling

### Error Response Format

**Development Mode:**
```json
{
  "error": "Error message",
  "stack": "Error stack trace..."
}
```

**Production Mode:**
```json
{
  "error": "Error message"
}
```

**File Reference:** `backend/src/middleware/errorHandler.ts:64-67`

### HTTP Status Codes

The application uses standard HTTP status codes defined in constants:

```typescript
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
}
```

**File Reference:** `backend/src/config/constants.ts:6-16`

### Standard Error Messages

Predefined error messages for consistency:

```typescript
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
}
```

**File Reference:** `backend/src/config/constants.ts:47-58`

### 404 Handler

Routes that don't match any endpoint return a structured 404 response:

```typescript
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    error: `Route ${req.method} ${req.path} not found`,
  });
};
```

**File Reference:** `backend/src/middleware/errorHandler.ts:73-77`

---

## Logging System

### Logger Implementation

The application uses a custom structured JSON logger for consistent log formatting.

**File Reference:** `backend/src/utils/logger.ts:1-99`

### Log Levels

1. **INFO:** General information (server start, database connections)
2. **WARN:** Operational errors (validation failures, not found errors)
3. **ERROR:** Unexpected errors (system failures, uncaught exceptions)
4. **DEBUG:** Development information (database queries, detailed traces)

### Log Format

All logs are output as JSON for easy parsing and monitoring:

```json
{
  "timestamp": "2025-11-19T12:00:00.000Z",
  "level": "info",
  "message": "Server started successfully",
  "data": {
    "port": 3000,
    "env": "development"
  }
}
```

**File Reference:** `backend/src/utils/logger.ts:8-13`

### Specialized Logging

**Database Query Logging:**
```typescript
logger.query(text, duration, rowCount);
```

Logs query text (truncated), execution time, and affected rows.

**File Reference:** `backend/src/utils/logger.ts:75-84`

**HTTP Request Logging:**
```typescript
logger.http(method, path, statusCode, duration);
```

**File Reference:** `backend/src/utils/logger.ts:87-95`

### Logger Methods

```typescript
logger.info('Server started');
logger.warn({ type: 'validation_error', field: 'email' });
logger.error({ type: 'database_error', error: err });
logger.debug('Detailed trace information');
```

---

## Configuration

### Environment Variables

The backend uses environment variables for configuration, loaded via dotenv.

**File Reference:** `backend/.env.example:1-10`

**Required Variables:**

#### Database Configuration
```
DB_HOST=your_database_host
DB_PORT=5432
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=your_database_name
```

#### Server Configuration
```
PORT=3000
NODE_ENV=development
```

**Optional Variables:**
- `DEBUG=true` - Enable debug logging

### Application Constants

All application-wide constants are centralized in one file:

**File Reference:** `backend/src/config/constants.ts:1-70`

**Categories:**
1. HTTP Status Codes
2. Pagination Settings
3. Database Field Names
4. Time Constants
5. Error Messages
6. Success Messages

---

## Setup and Installation

### Prerequisites
- Node.js (v16 or higher recommended)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

### Installation Steps

**1. Clone the Repository**
```bash
git clone <repository-url>
cd SmartJournalCS353/backend
```

**2. Install Dependencies**
```bash
npm install
```

**3. Configure Environment**
```bash
cp .env.example .env
# Edit .env with your database credentials
```

**4. Setup Database**
Ensure PostgreSQL is running and create the database:
```bash
createdb gratitude_journal
```

The application will automatically initialize the schema on first startup.

**5. Start Development Server**
```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in .env).

**6. Start Production Server**
```bash
npm start
```

### NPM Scripts

**File Reference:** `backend/package.json:6-8`

```json
{
  "start": "tsx ./src/index.ts",
  "dev": "tsx watch ./src/index.ts"
}
```

- `npm start` - Run server in production mode
- `npm run dev` - Run server in watch mode (auto-restart on file changes)

---

## Server Lifecycle

### Startup Process

**File Reference:** `backend/src/index.ts:41-64`

1. **Load Environment Variables:** `dotenv/config`
2. **Test Database Connection:** Verify PostgreSQL connectivity
3. **Initialize Database Schema:** Create tables, indexes, triggers if needed
4. **Start Express Server:** Listen on configured port
5. **Log Success:** Output server status and configuration

```typescript
async function startServer() {
  logger.info('Starting SmartJournal backend server...');

  const connected = await testConnection();
  if (!connected) {
    logger.error('Failed to connect to database');
    process.exit(1);
  }

  await initializeDatabase();

  app.listen(PORT, () => {
    logger.info({
      message: 'Server started successfully',
      port: PORT,
      env: process.env.NODE_ENV || 'development',
    });
  });
}
```

### Graceful Shutdown

The application handles shutdown signals gracefully:

**File Reference:** `backend/src/index.ts:67-77`

**Supported Signals:**
- `SIGINT` (Ctrl+C)
- `SIGTERM` (Process termination)

**Shutdown Process:**
1. Log shutdown signal received
2. Close database connection pool
3. Log shutdown complete
4. Exit process

```typescript
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully...`);
  try {
    await closePool();
    logger.info('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error({ type: 'shutdown_error', error });
    process.exit(1);
  }
};
```

### Error Recovery

The application handles uncaught errors and unhandled promise rejections:

**File Reference:** `backend/src/index.ts:83-98`

```typescript
process.on('uncaughtException', (error) => {
  logger.error({
    type: 'uncaught_exception',
    error: error.message,
    stack: error.stack,
  });
  void shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({
    type: 'unhandled_rejection',
    reason,
    promise,
  });
});
```

---

## TypeScript Types

The application uses comprehensive TypeScript types for type safety.

**File Reference:** `backend/src/types/index.ts:1-91`

### Core Data Models

```typescript
interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

interface JournalEntry {
  id: number;
  user_id: number;
  entry_date: Date;
  gratitude_text: string;
  mood?: string;
  tags?: string[];
  is_private: boolean;
  created_at: Date;
  updated_at: Date;
}

interface UserStreak {
  user_id: number;
  current_streak: number;
  longest_streak: number;
  total_entries: number;
  last_entry_date?: Date;
  streak_freeze_count: number;
  updated_at: Date;
}

interface Achievement {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  requirement_type: string;
  requirement_value: number;
}
```

### Input Types

```typescript
interface CreateUserInput {
  username: string;
  email: string;
  password_hash: string;
}

interface CreateJournalEntryInput {
  user_id: number;
  entry_date: Date;
  gratitude_text: string;
  mood?: string;
  tags?: string[];
  is_private?: boolean;
}

interface UpdateJournalEntryInput {
  gratitude_text?: string;
  mood?: string;
  tags?: string[];
  is_private?: boolean;
}
```

---

## Database Operations

### Query Helper Functions

**File Reference:** `backend/src/db/helpers.ts:11-25`

**Generic Query Function:**
```typescript
export async function query<T>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params);
  const duration = Date.now() - start;
  logger.query(text, duration, result.rowCount);
  return result;
}
```

Features:
- Generic type support for result rows
- Automatic query timing
- Query logging
- Error handling

### Transaction Support

**File Reference:** `backend/src/db/helpers.ts:27-42`

```typescript
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

Features:
- Automatic BEGIN/COMMIT
- Automatic ROLLBACK on error
- Connection release guarantee
- Type-safe callback results

### Database Initialization

**File Reference:** `backend/src/db/helpers.ts:44-59`

```typescript
export async function initializeDatabase(): Promise<void> {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    await pool.query(schema);
    logger.info('Database schema initialized');
  } catch (error: any) {
    // Ignore errors if objects already exist
    if (error.code === '42710' || error.code === '42P07') {
      logger.info('Database schema already exists, skipping initialization');
    } else {
      logger.error({ type: 'database_init_error', error });
      throw error;
    }
  }
}
```

Handles idempotent schema initialization - safe to run multiple times.

---

## Security Considerations

### Current Implementation

1. **Password Hashing:** Passwords are stored as hashes (field: `password_hash`)
2. **SQL Injection Prevention:** Parameterized queries used throughout
3. **CORS:** Enabled for cross-origin requests
4. **Cascade Deletion:** User data properly cleaned up when user is deleted

### Recommendations for Production

1. **Authentication:** Implement JWT or session-based authentication
2. **Authorization:** Add role-based access control (RBAC)
3. **Rate Limiting:** Prevent API abuse with rate limiting middleware
4. **HTTPS:** Use TLS/SSL in production
5. **Input Validation:** Add comprehensive input validation library (e.g., Joi, Zod)
6. **Helmet.js:** Add security headers
7. **Environment Security:** Secure .env file, use secrets manager
8. **Audit Logging:** Log security-relevant events

---

## Performance Optimizations

### Database Indexes

Indexes are created for common query patterns:
- User lookups by ID
- Journal entries by user and date
- Date range queries

**File Reference:** `backend/src/db/schema.sql:65-68`

### Connection Pooling

PostgreSQL connection pool configured for optimal performance:
- Pool size: 20 connections
- Idle timeout: 30 seconds
- Connection timeout: 2 seconds

**File Reference:** `backend/src/db/connection.ts:10-12`

### Query Optimization

- Parameterized queries prevent repeated parsing
- Indexes optimize WHERE and ORDER BY clauses
- Pagination prevents loading excessive data

---

## Future Enhancements

### Planned Features

1. **Authentication System:** JWT-based user authentication
2. **Password Reset:** Email-based password recovery
3. **Social Features:** Share gratitude entries with friends
4. **Analytics Dashboard:** Mood tracking graphs and insights
5. **Streak Freezes:** Implement streak freeze functionality
6. **Notifications:** Daily reminders to journal
7. **Export Data:** PDF/CSV export of journal entries
8. **Tags Management:** CRUD operations for user-defined tags
9. **Mood Analytics:** Track mood trends over time
10. **AI Prompts:** Generate personalized prompts using AI

### Technical Improvements

1. **API Documentation:** OpenAPI/Swagger documentation
2. **Unit Tests:** Comprehensive test coverage
3. **Integration Tests:** API endpoint testing
4. **Docker Support:** Containerization for easy deployment
5. **CI/CD Pipeline:** Automated testing and deployment
6. **API Versioning:** Support multiple API versions
7. **WebSocket Support:** Real-time notifications
8. **Caching Layer:** Redis for frequently accessed data
9. **Database Migrations:** Proper migration system (e.g., Knex.js)

---

## Development Team

**Project by Third Year Computer Science and Software Engineering Students at Maynooth University:**

- Stanislav Ustinov
- Rachel Bermingham
- Darragh Brean McCormack
- Oluwashina Taofeek Ojumide Anafi
- Dawid Makary Dulik
- Franklin Asare
- Anthony Enkhtur

---

## Conclusion

The SmartJournal backend provides a robust foundation for a mindfulness and wellbeing journaling application. Built with TypeScript and PostgreSQL, it offers a well-structured, type-safe API with comprehensive error handling, logging, and database management.

The architecture follows best practices including:
- RESTful API design
- Separation of concerns (routes, controllers, database functions)
- Centralized error handling
- Structured logging
- Database connection pooling
- Type safety with TypeScript
- Graceful shutdown handling

This backend is production-ready with the addition of authentication, authorization, and security hardening as outlined in the recommendations section.

---

**Document Generated:** November 19, 2025
**Backend Version:** 0.0.0
**Node.js Version Required:** 16+
**PostgreSQL Version Required:** 12+

---