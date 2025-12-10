import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function moodToEmoji(mood: string): string {
  if (!mood) return '';
  if (/\p{Emoji}/u.test(mood) && mood.length < 5) return mood;

  const map: Record<string, string> = {
    'Happy': '😊', 'Excited': '🤩', 'Grateful': '🙏',
    'Calm': '😌', 'Relaxed': '😌', 'Productive': '🚀',
    'Energetic': '⚡', 'Tired': '😴', 'Stressed': '😓',
    'Sad': '😢', 'Anxious': '😰', 'Angry': '😡', 'Neutral': '😐'
  };
  return map[mood] || map[mood.charAt(0).toUpperCase() + mood.slice(1)] || '😐';
}
