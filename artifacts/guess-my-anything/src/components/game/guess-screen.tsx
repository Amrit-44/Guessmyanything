"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Brain, Check, X, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameSnapshot } from "@/hooks/use-game";
import { useSound } from "@/hooks/use-sound";

interface Props {
  snapshot: GameSnapshot;
  loading: boolean;
  onConfirm: (correct: boolean) => void;
}

export function GuessScreen({ snapshot, loading, onConfirm }: Props) {
  const { play } = useSound();
  const guess = snapshot.guess;
  const guessesMade = snapshot.history.filter((h) => h).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-3 py-4 sm:px-4 sm:py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-6 text-center"
      >
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] neon-pink" style={{ fontFamily: "var(--font-pixel)" }}>
          <Brain className="h-3 w-3" />
          AI GUESS #{guessesMade > 0 ? snapshot.topGuesses.length : 1}
        </div>
        <h2
          className="text-xl neon-cyan sm:text-3xl"
          style={{ fontFamily: "var(--font-pixel)" }}
        >
          IS IT...
        </h2>
      </motion.div>

      {/* Main guess card */}
      <AnimatePresence mode="wait">
        {guess && (
          <motion.div
            key={guess.entityId}
            initial={{ opacity: 0, y: 30, rotateX: -20 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, type: "spring", bounce: 0.3 }}
            className="pixel-card relative mb-6 overflow-hidden rounded-sm p-6 text-center sm:p-10"
            style={{ borderColor: "var(--neon-pink)" }}
          >
            <div
              className="absolute -top-12 left-1/2 h-24 w-24 -translate-x-1/2 rounded-full opacity-40 blur-2xl"
              style={{ background: "var(--neon-pink)" }}
            />
            <Trophy className="mx-auto mb-3 h-10 w-10 neon-yellow sm:h-12 sm:w-12" />
            <h3
              className="mb-2 text-2xl neon-pink sm:text-4xl"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              {guess.entityName}
            </h3>
            {guess.description && (
              <p className="mx-auto mb-3 max-w-md text-sm text-foreground/70 sm:text-base">
                {guess.description}
              </p>
            )}
            <span
              className="inline-block rounded-sm border border-cyan-400/40 bg-cyan-400/10 px-2 py-1 text-[10px] neon-cyan"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              {guess.categoryName.toUpperCase()}
            </span>
            {guess.confidence !== undefined && guess.confidence > 0 && (
              <div className="mt-3 flex items-center justify-center gap-2">
                <span className="text-[9px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel)" }}>
                  CONFIDENCE
                </span>
                <span
                  className="text-sm"
                  style={{
                    fontFamily: "var(--font-pixel)",
                    color:
                      guess.confidence >= 60
                        ? "var(--neon-green)"
                        : guess.confidence >= 35
                        ? "var(--neon-yellow)"
                        : "var(--neon-pink)",
                  }}
                >
                  {guess.confidence}%
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm / deny */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-sm bg-background/60 backdrop-blur-sm">
            <span className="text-sm neon-cyan blink" style={{ fontFamily: "var(--font-pixel)" }}>
              THINKING
            </span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => {
              play("correct");
              onConfirm(true);
            }}
            disabled={loading}
            className="pixel-btn h-16 flex-col gap-1 rounded-sm border-2 border-[var(--neon-green)] bg-[var(--neon-green)]/15 text-[var(--neon-green)] hover:bg-[var(--neon-green)]/25"
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            <Check className="h-5 w-5" />
            <span className="text-xs sm:text-sm">YES! THAT&apos;S IT</span>
          </Button>
          <Button
            onClick={() => {
              play("wrong");
              onConfirm(false);
            }}
            disabled={loading}
            className="pixel-btn h-16 flex-col gap-1 rounded-sm border-2 border-[var(--neon-pink)] bg-[var(--neon-pink)]/15 text-[var(--neon-pink)] hover:bg-[var(--neon-pink)]/25"
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            <X className="h-5 w-5" />
            <span className="text-xs sm:text-sm">NO, KEEP GUESSING</span>
          </Button>
        </div>
      </div>

      {/* Top 3 alternative guesses */}
      {snapshot.topGuesses.length > 1 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-3 w-3 neon-yellow" />
            <span className="text-[10px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel)" }}>
              ALSO CONSIDERING
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {snapshot.topGuesses.slice(0, 3).map((g, i) => (
              <div
                key={g.entityId}
                className={`flex items-center gap-2 rounded-sm border p-2 text-sm ${
                  i === 0
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-muted/20"
                }`}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm text-[10px]"
                  style={{
                    fontFamily: "var(--font-pixel)",
                    color:
                      i === 0
                        ? "var(--neon-pink)"
                        : i === 1
                        ? "var(--neon-cyan)"
                        : "var(--neon-yellow)",
                  }}
                >
                  #{i + 1}
                </span>
                <span className="truncate">{g.entityName}</span>
                {g.confidence !== undefined && (
                  <span
                    className="ml-auto text-[10px]"
                    style={{
                      fontFamily: "var(--font-pixel)",
                      color:
                        g.confidence >= 50
                          ? "var(--neon-green)"
                          : "var(--muted-foreground)",
                    }}
                  >
                    {g.confidence}%
                  </span>
                )}
                {g.confidence === undefined && (
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {g.score}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
