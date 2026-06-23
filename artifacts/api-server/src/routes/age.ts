import { Router } from "express";
import {
  startAgeGame, answerAgeQuestion, confirmAgeGuess, learnAgeFromFailure, getAgeSnapshot,
} from "../lib/age-service.js";

const router = Router();

router.post("/start", async (_req, res) => {
  try {
    const snapshot = await startAgeGame();
    res.json(snapshot);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/answer", async (req, res) => {
  try {
    const { sessionId, answer } = req.body;
    if (!sessionId || !answer) return res.status(400).json({ error: "sessionId and answer required" });
    const snapshot = await answerAgeQuestion(sessionId, answer);
    res.json(snapshot);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/confirm", async (req, res) => {
  try {
    const { sessionId, correct } = req.body;
    if (!sessionId || correct === undefined) return res.status(400).json({ error: "sessionId and correct required" });
    const snapshot = await confirmAgeGuess(sessionId, !!correct);
    res.json(snapshot);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/learn", async (req, res) => {
  try {
    const { sessionId, actualAge } = req.body;
    if (!sessionId || actualAge === undefined) return res.status(400).json({ error: "sessionId and actualAge required" });
    const result = await learnAgeFromFailure(sessionId, Number(actualAge));
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/state/:sessionId", async (req, res) => {
  try {
    const snapshot = await getAgeSnapshot(req.params.sessionId);
    if (!snapshot) return res.status(404).json({ error: "Session not found" });
    res.json(snapshot);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
