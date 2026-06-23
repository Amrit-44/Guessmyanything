import { Router } from "express";
import {
  startGame, answerQuestion, confirmGuess, undoLastAnswer,
  restartGame, learnFromFailure, getSnapshot, submitFeedback,
} from "../lib/game-service.js";

const router = Router();

router.post("/start", async (req, res) => {
  try {
    const { category } = req.body;
    const snapshot = await startGame(category ?? null);
    res.json(snapshot);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/answer", async (req, res) => {
  try {
    const { sessionId, answer } = req.body;
    if (!sessionId || !answer) return res.status(400).json({ error: "sessionId and answer required" });
    const snapshot = await answerQuestion(sessionId, answer);
    res.json(snapshot);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/confirm", async (req, res) => {
  try {
    const { sessionId, correct } = req.body;
    if (!sessionId || correct === undefined) return res.status(400).json({ error: "sessionId and correct required" });
    const snapshot = await confirmGuess(sessionId, !!correct);
    res.json(snapshot);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/undo", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });
    const snapshot = await undoLastAnswer(sessionId);
    res.json(snapshot);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/restart", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: "sessionId required" });
    const snapshot = await restartGame(sessionId);
    res.json(snapshot);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/learn", async (req, res) => {
  try {
    const { sessionId, correctAnswer, category, description } = req.body;
    if (!sessionId || !correctAnswer) return res.status(400).json({ error: "sessionId and correctAnswer required" });
    const result = await learnFromFailure(sessionId, correctAnswer, category, description);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/state/:sessionId", async (req, res) => {
  try {
    const snapshot = await getSnapshot(req.params.sessionId);
    if (!snapshot) return res.status(404).json({ error: "Session not found" });
    res.json(snapshot);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/feedback", async (req, res) => {
  try {
    const { type, message, context, rating } = req.body;
    if (!type || !message) return res.status(400).json({ error: "type and message required" });
    const result = await submitFeedback(type, message, context, rating);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
