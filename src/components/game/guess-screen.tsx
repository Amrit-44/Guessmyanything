"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Sparkles, Trophy } from "lucide-react";
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

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <p className="mb-3 text-sm font-medium text-gray-500">I think it's...</p>

        <AnimatePresence mode="wait">
          {guess && (
            <motion.div
              key={guess.entityId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.3 }}
              className="mb-6 rounded-2xl border-2 border-indigo-200 bg-white p-8 shadow-lg sm:p-10"
            >
              <Trophy className="mx-auto mb-3 h-12 w-12 text-indigo-500" />
              <h3 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
                {guess.entityName}
              </h3>
              {guess.description && (
                <p className="mx-auto mb-3 max-w-md text-sm text-gray-500">
                  {guess.description}
                </p>
              )}
              <span className="inline-block rounded-lg bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                {guess.categoryName}
              </span>
              {guess.confidence !== undefined && guess.confidence > 0 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <span className="text-xs text-gray-400">Confidence</span>
                  <span
                    className="text-sm font-semibold"
                    style={{
                      color: guess.confidence >= 60 ? "#22c55e" : guess.confidence >= 35 ? "#f59e0b" : "#6b7280",
                    }}
                  >
                    {guess.confidence}%
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => { play("correct"); onConfirm(true); }}
            disabled={loading}
            className="h-14 flex-col gap-1 rounded-xl border-2 border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
          >
            <Check className="h-5 w-5" />
            <span className="text-sm font-semibold">Yes! That's it</span>
          </Button>
          <Button
            onClick={() => { play("wrong"); onConfirm(false); }}
            disabled={loading}
            className="h-14 flex-col gap-1 rounded-xl border-2 border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          >
            <X className="h-5 w-5" />
            <span className="text-sm font-semibold">No, keep guessing</span>
          </Button>
        </div>
      </motion.div>

      {/* Top 3 alternative guesses */}
      {snapshot.topGuesses.length > 1 && (
        <div className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Also considering</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {snapshot.topGuesses.slice(0, 3).map((g, i) => (
              <div
                key={g.entityId}
                className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${
                  i === 0
                    ? "border-indigo-200 bg-indigo-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                  style={{
                    color: i === 0 ? "#4f46e5" : i === 1 ? "#3b82f6" : "#6b7280",
                  }}
                >
                  #{i + 1}
                </span>
                <span className="truncate text-gray-700">{g.entityName}</span>
                {g.confidence !== undefined && (
                  <span className="ml-auto text-xs text-gray-400">{g.confidence}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
