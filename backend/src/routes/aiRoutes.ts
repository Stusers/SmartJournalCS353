// backend/src/routes/aiRoutes.ts
import { Router } from "express";
import { generateWeeklyInsight } from "../controllers/aiInsightController.js";

const router = Router();

// POST /api/ai/weekly-insight
router.post("/ai/weekly-insight", generateWeeklyInsight);

export default router;
