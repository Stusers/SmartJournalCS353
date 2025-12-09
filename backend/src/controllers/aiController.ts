import { Request, Response } from 'express';

export const analyzeReflection = async (req: Request, res: Response) => {
    const { entries } = req.body;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        console.error('OPENROUTER_API_KEY is missing');
        return res.status(500).json({ error: 'AI service not configured' });
    }

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
        return res.status(400).json({ error: 'No entries provided for analysis' });
    }

    // Mash everything into a big string for the LLM
    const context = entries.map((e: any) =>
        `Date: ${e.entry_date}, Mood: ${e.mood || 'N/A'}, Text: ${e.gratitude_text || 'No text'}`
    ).join('\n---\n');

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5173', // For OpenRouter rankings
                'X-Title': 'SmartJournal',
            },
            body: JSON.stringify({
                model: 'mistralai/mistral-7b-instruct:free', // Free tier ftw
                messages: [
                    {
                        role: 'system',
                        content: 'You are an insightful journaling assistant. Analyze the user\'s entries. Go in-depth. meaningful advice based on their patterns. For example, "You seem busier on weekdays, try meal prepping on your calm Wednesdays." Connect specific moods to days or activities. Keep it under 60 words.'
                    },
                    { role: 'user', content: context }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenRouter API Error:', errorText);
            throw new Error(`OpenRouter API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
            res.json({ insight: data.choices[0].message.content });
        } else {
            res.status(500).json({ error: 'No insight generated' });
        }
    } catch (error) {
        console.error('AI Analysis failed:', error);
        res.status(500).json({ error: 'Failed to analyze entries' });
    }
};
