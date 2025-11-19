export interface User {
  id: number;
  clerk_id?: string | null;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface JournalEntry {
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

export interface UserStreak {
  user_id: number;
  current_streak: number;
  longest_streak: number;
  total_entries: number;
  last_entry_date?: Date;
  streak_freeze_count: number;
  updated_at: Date;
}

export interface Achievement {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  requirement_type: string;
  requirement_value: number;
}

export interface UserAchievement {
  user_id: number;
  achievement_id: number;
  earned_at: Date;
}

export interface DailyPrompt {
  id: number;
  prompt_text: string;
  category?: string;
  created_at: Date;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password_hash: string;
}

export interface CreateJournalEntryInput {
  user_id: number;
  entry_date: Date;
  gratitude_text: string;
  mood?: string;
  tags?: string[];
  is_private?: boolean;
}

export interface UpdateJournalEntryInput {
  gratitude_text?: string;
  mood?: string;
  tags?: string[];
  is_private?: boolean;
}

export interface StreakStats {
  current_streak: number;
  longest_streak: number;
  total_entries: number;
  last_entry_date?: Date;
  streak_freeze_count: number;
}

export interface UserStats {
  total_entries: number;
  current_streak: number;
  longest_streak: number;
  achievements_earned: number;
  entries_this_week: number;
  entries_this_month: number;
}