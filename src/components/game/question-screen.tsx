"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Undo2, RotateCcw, ListOrdered, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnswerButtons } from "./answer-buttons";
import type { GameSnapshot, Answer } from "@/hooks/use-game";
import { useSound } from "@/hooks/use-sound";

interface Props {
  snapshot: GameSnapshot;
  loading: boolean;
  onAnswer: (a: Answer) => void;
  onUndo: () => void;
  onRestart: () => void;
}

const ANSWER_LABEL: Record<Answer, string> = {
  yes: "Yes",
  probably: "Probably",
  dont_know: "Don't know",
  probably_not: "Probably not",
  no: "No",
};

export function QuestionScreen({
  snapshot,
  loading,
  onAnswer,
  onUndo,
  onRestart,
}: Props) {
  const { play } = useSound();
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleAnswer = (a: Answer) => {
    play("answer");
    onAnswer(a);
  };

  const confidencePercent = Math.max(0, Math.min(100, snapshot.confidence.percent));
  const barColor =
    confidencePercent >= 75 ? "#22c55e" : confidencePercent >= 45 ? "#f59e0b" : "#6b7280";

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      {/* Top bar */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {snapshot.categoryName && (
            <span className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
              {snapshot.categoryName}
            </span>
          )}
          {snapshot.industry && (
            <span className="rounded-lg bg-green-50 px-3 py-1 text-xs font-medium text-green-600">
              {snapshot.industry.name} {snapshot.industry.confidence}%
            </span>
          )}
          <button
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-400 transition-colors hover:text-gray-700"
          >
            <ListOrdered className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">History</span>
            <span>({snapshot.history.length})</span>
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => { play("tick"); onUndo(); }}
            disabled={loading || snapshot.history.length === 0}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 transition-colors hover:text-gray-800 disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </button>
          <button
            onClick={onRestart}
            disabled={loading}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-500 transition-colors hover:text-gray-800 disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </button>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mb-6">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-gray-600">AI Confidence</span>
          <span className="text-gray-400">Question {snapshot.questionCount}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-gray-100">
          <motion.div
            className="h-full rounded-full"
            style={{ background: barColor }}
            animate={{ width: `${confidencePercent}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={snapshot.question?.questionId}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
          className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <p className="mb-3 text-xs font-medium text-indigo-500">
            Question {snapshot.questionCount}
          </p>
          <h2 className="text-xl font-semibold leading-snug text-gray-900 sm:text-2xl">
            {snapshot.question?.text}
          </h2>
        </motion.div>
      </AnimatePresence>

      {/* Answer buttons */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              Thinking...
            </div>
          </div>
        )}
        <AnswerButtons onAnswer={handleAnswer} disabled={loading} />
      </div>

      {/* History dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Question History</DialogTitle>
          </DialogHeader>
          {snapshot.history.length === 0 ? (
            <p className="text-sm text-gray-400">No questions yet.</p>
          ) : (
            <ol className="space-y-2">
              {snapshot.history.map((h, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-600">
                    {i + 1}
                  </span>
                  <p className="flex-1 text-gray-700">{h.questionText}</p>
                  <span className="shrink-0 rounded-lg bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {ANSWER_LABEL[h.answer]}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
