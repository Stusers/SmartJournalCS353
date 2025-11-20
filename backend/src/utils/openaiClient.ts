// backend/src/utils/openaiClient.ts
import OpenAI from "openai";
import { logger } from "./logger.js";

if (!process.env.OPENAI_API_KEY) {
  logger.error("Missing OPENAI_API_KEY in environment");
  throw new Error("Missing OPENAI_API_KEY");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
