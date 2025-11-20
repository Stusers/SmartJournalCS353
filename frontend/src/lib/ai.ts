// frontend/src/lib/ai.ts

const API_BASE = 'http://localhost:3000/api';

type AiInsightResponse = {
  insight: string;
};

export const aiApi = {
  generateWeeklyInsight: async (
    reflectionText: string
  ): Promise<AiInsightResponse> => {
    const response = await fetch(`${API_BASE}/ai/weekly-insight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reflectionText }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      const message = error.error || `HTTP ${response.status}: ${response.statusText}`;
      console.error('[AI API Error] /ai/weekly-insight:', message);
      throw new Error(message);
    }

    return response.json();
  },
};
