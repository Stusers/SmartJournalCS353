// backend/src/controllers/aiInsightController.ts
import type { Request, Response, NextFunction } from "express";
import { openai } from "../utils/openaiClient.js";
import { logger } from "../utils/logger.js";

export const generateWeeklyInsight = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { reflectionText } = req.body;

    if (!reflectionText || typeof reflectionText !== "string") {
      return res.status(400).json({
        error: "reflectionText is required and must be a string",
      });
    }

    const prompt = `
You are a supportive journaling coach.

The user wrote this weekly reflection:

"${reflectionText}"

1. Summarize 2–3 key emotional themes you notice.
2. Give 2 short, practical suggestions for next week.
3. Keep it warm, encouraging, and under 200 words total.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You help people reflect on their week with kind, practical insights.",
        },
        { role: "user", content: prompt },
      ],
    });

    const content = completion.choices[0]?.message?.content?.trim() ?? "";

    logger.info({
      type: "ai_weekly_insight_generated",
      length: content.length,
    });

    return res.json({
      insight: content,
    });
  } catch (error) {
    logger.error({
      type: "ai_weekly_insight_error",
      error,
    });
    next(error);
  }
};
