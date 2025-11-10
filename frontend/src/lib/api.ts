// API client for backend communication
import type {
  User,
  JournalEntry,
  Achievement,
  UserStats,
  DailyPrompt
} from 'shared';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';

const API_BASE = 'http://localhost:3000/api';

// Hook to get API functions with auth token
export function useApi() {
  const { getToken } = useClerkAuth();
  
  const fetchWithAuth = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      return fetchApi<T>(endpoint, { ...options, token });
    } catch (error) {
      console.error('Error in fetchWithAuth:', error);
      throw error;
    }
  };

  return {
    userApi: {
      getStats: () => fetchWithAuth<UserStats>(`/users/me/stats`),
    },
    journalApi: {
      create: (userId: number, gratitudeText: string, mood?: string, tags?: string[]) =>
        fetchWithAuth<{ entry: JournalEntry; new_achievements: Achievement[] }>('/entries', {
          method: 'POST',
          body: JSON.stringify({
            entry_date: new Date().toISOString().split('T')[0],
            gratitude_text: gratitudeText,
            mood,
            tags,
            is_private: false,
          }),
        }),
      getByUserId: (_userId: number, limit = 20) =>
        fetchWithAuth<JournalEntry[]>(`/users/me/entries?limit=${limit}`),
      update: (entryId: number, updates: Partial<JournalEntry>) =>
        fetchWithAuth<JournalEntry>(`/entries/${entryId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        }),
      delete: (entryId: number) =>
        fetchWithAuth<void>(`/entries/${entryId}`, { method: 'DELETE' }),
      search: (_userId: number, query: string) =>
        fetchWithAuth<JournalEntry[]>(`/users/me/entries/search?q=${encodeURIComponent(query)}`),
    },
    achievementApi: {
      getAll: () => fetchWithAuth<Achievement[]>('/achievements'),
      getUserAchievements: (_userId: number) =>
        fetchWithAuth<Achievement[]>(`/users/me/achievements`),
      getUserProgress: (_userId: number) =>
        fetchWithAuth<any[]>(`/users/me/achievements/progress`),
    },
    promptApi: {
      getRandom: () => fetchWithAuth<DailyPrompt>('/prompts/random'),
      getAll: () => fetchWithAuth<DailyPrompt[]>('/prompts'),
    },
  };
}

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

async function fetchApi<T>(endpoint: string, options?: RequestInit & { token?: string | null }): Promise<T> {
  const method = options?.method || 'GET';
  const { token, ...fetchOptions } = options || {};

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    // Add auth token if provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      headers,
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

// Legacy exports for prompts (public endpoints, no auth needed)
export const promptApi = {
  getRandom: () =>
    fetchApi<DailyPrompt>('/prompts/random'),

  getAll: () =>
    fetchApi<DailyPrompt[]>('/prompts'),
};
