// API client for backend communication
import type {
  User,
  JournalEntry,
  Achievement,
  UserStats,
  DailyPrompt
} from 'shared';

const API_BASE = 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public endpoint: string,
    public method: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const method = options?.method || 'GET';

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      const errorMessage = error.error || `HTTP ${response.status}: ${response.statusText}`;

      console.error(`[API Error] ${method} ${endpoint}:`, {
        status: response.status,
        statusText: response.statusText,
        message: errorMessage,
        error,
      });

      throw new ApiError(errorMessage, response.status, endpoint, method);
    }

    // Handle no-content responses
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  } catch (error) {
    // Re-throw ApiError as-is
    if (error instanceof ApiError) {
      throw error;
    }

    // Handle network errors
    console.error(`[Network Error] ${method} ${endpoint}:`, error);
    throw new ApiError(
      'Network error: Unable to connect to server. Please ensure the backend is running.',
      0,
      endpoint,
      method
    );
  }
}

// User APIs
export const userApi = {
  create: (username: string, email: string, password: string) =>
    fetchApi<Omit<User, 'password_hash'>>('/users', {
      method: 'POST',
      body: JSON.stringify({ username, email, password_hash: password }),
    }),

  getById: (id: number) =>
    fetchApi<Omit<User, 'password_hash'>>(`/users/${id}`),

  getStats: (id: number) =>
    fetchApi<UserStats>(`/users/${id}/stats`),
};

// Journal APIs
export const journalApi = {
  create: (userId: number, gratitudeText: string, mood?: string, tags?: string[]) =>
    fetchApi<{ entry: JournalEntry; new_achievements: Achievement[] }>('/entries', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        entry_date: new Date().toISOString().split('T')[0],
        gratitude_text: gratitudeText,
        mood,
        tags,
        is_private: false,
      }),
    }),

  getByUserId: (userId: number, limit = 20) =>
    fetchApi<JournalEntry[]>(`/users/${userId}/entries?limit=${limit}`),

  update: (entryId: number, updates: Partial<JournalEntry>) =>
    fetchApi<JournalEntry>(`/entries/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  delete: (entryId: number) =>
    fetchApi<void>(`/entries/${entryId}`, { method: 'DELETE' }),

  search: (userId: number, query: string) =>
    fetchApi<JournalEntry[]>(`/users/${userId}/entries/search?q=${encodeURIComponent(query)}`),
};

// Achievement APIs
export const achievementApi = {
  getAll: () =>
    fetchApi<Achievement[]>('/achievements'),

  getUserAchievements: (userId: number) =>
    fetchApi<Achievement[]>(`/users/${userId}/achievements`),

  getUserProgress: (userId: number) =>
    fetchApi<any[]>(`/users/${userId}/achievements/progress`),
};

// Prompt APIs
export const promptApi = {
  getRandom: () =>
    fetchApi<DailyPrompt>('/prompts/random'),

  getAll: () =>
    fetchApi<DailyPrompt[]>('/prompts'),
};
