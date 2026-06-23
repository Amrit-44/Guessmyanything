"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Undo2, RotateCcw, Brain, ListOrdered } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AnswerButtons } from "./answer-buttons";
import { ConfidenceMeter } from "./confidence-meter";
import type { GameSnapshot } from "@/hooks/use-game";
import type { Answer } from "@/hooks/use-game";
import { useSound } from "@/hooks/use-sound";

interface Props {
  snapshot: GameSnapshot;
  loading: boolean;
  onAnswer: (a: Answer) => void;
  onUndo: () => void;
  onRestart: () => void;
}

const ANSWER_LABEL: Record<Answer, string> = {
  yes: "YES",
  probably: "PROB.",
  dont_know: "IDK",
  probably_not: "PROB. NOT",
  no: "NO",
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

  return (
    <div className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-4 sm:py-8">
      {/* Top bar: category + controls */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {snapshot.categoryName ? (
            <span
              className="rounded-sm border border-primary/40 bg-primary/10 px-2 py-1 text-[9px] neon-pink"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              {snapshot.categoryName.toUpperCase()}
            </span>
          ) : (
            <span
              className="rounded-sm border border-cyan-400/40 bg-cyan-400/10 px-2 py-1 text-[9px] neon-cyan"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              ANYTHING
            </span>
          )}
          {snapshot.industry && (
            <span
              className="rounded-sm border border-[var(--neon-green)]/50 bg-[var(--neon-green)]/10 px-2 py-1 text-[9px] neon-green"
              style={{ fontFamily: "var(--font-pixel)" }}
              title={`Industry confidence: ${snapshot.industry.confidence}%`}
            >
              {snapshot.industry.name.toUpperCase()} {snapshot.industry.confidence}%
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setHistoryOpen(true)}
            className="h-7 gap-1 px-2 text-xs"
          >
            <ListOrdered className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">History</span>
            <span className="text-muted-foreground">({snapshot.history.length})</span>
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              play("tick");
              onUndo();
            }}
            disabled={loading || snapshot.history.length === 0}
            className="h-8 gap-1 px-2 text-xs"
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Undo</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRestart}
            disabled={loading}
            className="h-8 gap-1 px-2 text-xs text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Restart</span>
          </Button>
        </div>
      </div>

      {/* Confidence meter */}
      <div className="mb-6">
        <ConfidenceMeter
          percent={snapshot.confidence.percent}
          questionNumber={snapshot.questionCount}
        />
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={snapshot.question?.questionId}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.22 }}
          className="pixel-card relative mb-6 overflow-hidden rounded-sm p-6 sm:p-8"
        >
          <div className="absolute right-3 top-3 flex items-center gap-1 text-[9px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel)" }}>
            <Brain className="h-3 w-3 neon-cyan" />
            Q{snapshot.questionCount}
          </div>
          <div className="mb-3 text-[10px] neon-cyan" style={{ fontFamily: "var(--font-pixel)" }}>
            QUESTION {snapshot.questionCount}
          </div>
          <h2
            className="text-lg leading-snug sm:text-2xl"
            style={{ fontFamily: "var(--font-retro)" }}
          >
            {snapshot.question?.text}
          </h2>
        </motion.div>
      </AnimatePresence>

      {/* Answer buttons */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-sm bg-background/60 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm neon-cyan" style={{ fontFamily: "var(--font-pixel)" }}>
              <Brain className="h-4 w-4 animate-pulse" />
              <span className="blink">THINKING</span>
            </div>
          </div>
        )}
        <AnswerButtons onAnswer={handleAnswer} disabled={loading} />
      </div>

      {/* History dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="neon-cyan" style={{ fontFamily: "var(--font-pixel)" }}>
              QUESTION HISTORY
            </DialogTitle>
          </DialogHeader>
          {snapshot.history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No questions yet.</p>
          ) : (
            <ol className="space-y-2">
              {snapshot.history.map((h, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-sm border border-border bg-muted/30 p-3 text-sm"
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-primary/15 text-[10px] neon-pink"
                    style={{ fontFamily: "var(--font-pixel)" }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{h.questionText}</p>
                  </div>
                  <span
                    className="shrink-0 rounded-sm border border-border px-2 py-0.5 text-[10px]"
                    style={{ fontFamily: "var(--font-pixel)" }}
                  >
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
