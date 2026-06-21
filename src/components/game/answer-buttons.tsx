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
  bgColor: string;
  textColor: string;
  borderColor: string;
  desc: string;
}[] = [
  {
    value: "yes",
    label: "Yes",
    icon: <Check className="h-4 w-4" />,
    bgColor: "bg-green-50",
    textColor: "text-green-700",
    borderColor: "border-green-200",
    desc: "Definitely",
  },
  {
    value: "probably",
    label: "Probably",
    icon: <ChevronUp className="h-4 w-4" />,
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
    borderColor: "border-blue-200",
    desc: "Mostly yes",
  },
  {
    value: "dont_know",
    label: "Don't know",
    icon: <HelpCircle className="h-4 w-4" />,
    bgColor: "bg-gray-50",
    textColor: "text-gray-600",
    borderColor: "border-gray-200",
    desc: "Unsure",
  },
  {
    value: "probably_not",
    label: "Probably not",
    icon: <ChevronDown className="h-4 w-4" />,
    bgColor: "bg-orange-50",
    textColor: "text-orange-700",
    borderColor: "border-orange-200",
    desc: "Mostly no",
  },
  {
    value: "no",
    label: "No",
    icon: <X className="h-4 w-4" />,
    bgColor: "bg-red-50",
    textColor: "text-red-700",
    borderColor: "border-red-200",
    desc: "Definitely not",
  },
];

export function AnswerButtons({ onAnswer, disabled }: Props) {
  return (
    <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-5">
      {OPTIONS.map((opt, i) => (
        <motion.button
          key={opt.value}
          type="button"
          disabled={disabled}
          onClick={() => onAnswer(opt.value)}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.2 }}
          whileHover={!disabled ? { scale: 1.03, y: -2 } : undefined}
          whileTap={!disabled ? { scale: 0.97 } : undefined}
          className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-3 py-4 transition-all ${opt.bgColor} ${opt.textColor} ${opt.borderColor} disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md`}
        >
          <span className="flex h-6 w-6 items-center justify-center">{opt.icon}</span>
          <span className="text-sm font-semibold">{opt.label}</span>
          <span className="hidden text-[10px] opacity-60 sm:block">{opt.desc}</span>
        </motion.button>
      ))}
    </div>
  );
}
