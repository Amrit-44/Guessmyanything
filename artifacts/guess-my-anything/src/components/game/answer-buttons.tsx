"use client";

import { motion } from "framer-motion";
import { Check, ChevronUp, HelpCircle, ChevronDown, X } from "lucide-react";
import type { Answer } from "@/hooks/use-game";

interface Props {
  onAnswer: (a: Answer) => void;
  disabled?: boolean;
}

const OPTIONS: {
  value: Answer;
  label: string;
  icon: React.ReactNode;
  color: string;
  glow: string;
  desc: string;
}[] = [
  {
    value: "yes",
    label: "YES",
    icon: <Check className="h-4 w-4" />,
    color: "border-[var(--neon-green)] text-[var(--neon-green)] bg-[var(--neon-green)]/10",
    glow: "rgba(74,222,128,0.5)",
    desc: "Definitely",
  },
  {
    value: "probably",
    label: "PROBABLY",
    icon: <ChevronUp className="h-4 w-4" />,
    color: "border-[var(--neon-cyan)] text-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10",
    glow: "rgba(34,211,238,0.5)",
    desc: "Mostly yes",
  },
  {
    value: "dont_know",
    label: "DON'T KNOW",
    icon: <HelpCircle className="h-4 w-4" />,
    color: "border-muted-foreground text-muted-foreground bg-muted/30",
    glow: "rgba(150,150,160,0.4)",
    desc: "Unsure",
  },
  {
    value: "probably_not",
    label: "PROBABLY NOT",
    icon: <ChevronDown className="h-4 w-4" />,
    color: "border-[var(--neon-orange)] text-[var(--neon-orange)] bg-[var(--neon-orange)]/10",
    glow: "rgba(251,146,60,0.5)",
    desc: "Mostly no",
  },
  {
    value: "no",
    label: "NO",
    icon: <X className="h-4 w-4" />,
    color: "border-[var(--neon-pink)] text-[var(--neon-pink)] bg-[var(--neon-pink)]/10",
    glow: "rgba(255,46,136,0.5)",
    desc: "Definitely not",
  },
];

export function AnswerButtons({ onAnswer, disabled }: Props) {
  return (
    <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-5">
      {OPTIONS.map((opt, i) => (
        <motion.button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onAnswer(opt.value)}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.18 }}
          whileHover={!disabled ? { scale: 1.03, y: -2 } : undefined}
          whileTap={!disabled ? { scale: 0.96 } : undefined}
          className={`pixel-btn group flex flex-col items-center justify-center gap-1 rounded-sm px-2 py-3 text-xs ${opt.color}`}
          style={{ fontFamily: "var(--font-pixel)" }}
          aria-label={opt.label}
        >
          <span className="flex h-6 w-6 items-center justify-center">{opt.icon}</span>
          <span className="text-[10px] leading-tight sm:text-[11px]">{opt.label}</span>
          <span
            className="hidden text-[9px] opacity-60 sm:block"
            style={{ fontFamily: "var(--font-retro)" }}
          >
            {opt.desc}
          </span>
        </motion.button>
      ))}
    </div>
  );
}
