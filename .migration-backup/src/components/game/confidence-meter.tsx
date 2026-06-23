"use client";

import { motion } from "framer-motion";

interface Props {
  percent: number;
  questionNumber: number;
  maxQuestions?: number;
}

export function ConfidenceMeter({ percent, questionNumber, maxQuestions = 28 }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  const segments = 14;
  const filled = Math.round((clamped / 100) * segments);

  const barColor =
    clamped >= 75
      ? "var(--neon-green)"
      : clamped >= 45
      ? "var(--neon-yellow)"
      : "var(--neon-pink)";

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel)" }}>
        <span className="neon-cyan">AI CONFIDENCE</span>
        <span>
          Q {questionNumber}/{maxQuestions}
        </span>
      </div>
      <div className="flex gap-0.5" role="meter" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
        {Array.from({ length: segments }).map((_, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              opacity: i < filled ? 1 : 0.18,
              scaleY: i < filled ? 1 : 0.7,
            }}
            transition={{ duration: 0.2 }}
            className="h-3 flex-1 rounded-[1px]"
            style={{
              background: i < filled ? barColor : "var(--muted)",
              boxShadow: i < filled ? `0 0 6px ${barColor}` : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}
