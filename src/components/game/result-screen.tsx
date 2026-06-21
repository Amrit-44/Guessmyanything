"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Trophy, Frown, Share2, RotateCcw, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { GameSnapshot } from "@/hooks/use-game";
import { useSound } from "@/hooks/use-sound";

interface Props {
  snapshot: GameSnapshot;
  loading: boolean;
  onRestart: () => void;
  onLearn: (correctAnswer: string, description?: string) => void;
  onPlayAgain: () => void;
}

export function ResultScreen({
  snapshot,
  loading,
  onRestart,
  onLearn,
  onPlayAgain,
}: Props) {
  const { play } = useSound();
  const won = snapshot.status === "won";
  const [answer, setAnswer] = useState("");
  const [desc, setDesc] = useState("");
  const [learned, setLearned] = useState(false);

  const handleShare = async () => {
    play("tick");
    const text = won
      ? `Guess My Anything guessed my answer in ${snapshot.questionCount} questions! Can you stump it?`
      : `I stumped Guess My Anything! Think you can do better?`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Guess My Anything", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
      }
    } catch {
      /* cancelled */
    }
  };

  const handleLearn = () => {
    if (!answer.trim()) {
      toast.error("Tell me what you were thinking of!");
      return;
    }
    play("select");
    onLearn(answer.trim(), desc.trim() || undefined);
    setLearned(true);
    toast.success("Thanks! I'll learn from this.");
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      {won ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, type: "spring", bounce: 0.3 }}
          className="text-center"
        >
          {/* Confetti sparkles */}
          <div className="relative mb-4 inline-block">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.2, 0],
                  x: Math.cos((i / 8) * Math.PI * 2) * 60,
                  y: Math.sin((i / 8) * Math.PI * 2) * 60,
                }}
                transition={{ duration: 1.5, delay: 0.2 + i * 0.05, repeat: Infinity, repeatDelay: 1 }}
                className="absolute left-1/2 top-1/2"
              >
                <Sparkles className="h-4 w-4 text-yellow-400" />
              </motion.div>
            ))}
            <Trophy className="mx-auto h-20 w-20 text-indigo-500 sm:h-24 sm:w-24" />
          </div>

          <h2 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
            I got it!
          </h2>
          <p className="mb-1 text-sm text-gray-500">Your answer was</p>
          <p className="mb-4 text-3xl font-bold text-indigo-600 sm:text-4xl">
            {snapshot.guess?.entityName}
          </p>
          <div className="mb-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-600">
            Guessed in <span className="font-bold text-indigo-600">{snapshot.questionCount}</span> questions
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              onClick={() => { play("start"); onPlayAgain(); }}
              className="h-12 gap-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <RotateCcw className="h-4 w-4" />
              Play Again
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="h-12 gap-2 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-6 text-center">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.6, repeat: 2 }}
            >
              <Frown className="mx-auto mb-3 h-20 w-20 text-gray-400 sm:h-24 sm:w-24" />
            </motion.div>
            <h2 className="mb-2 text-3xl font-bold text-gray-900 sm:text-4xl">
              You stumped me!
            </h2>
            <p className="text-sm text-gray-500 sm:text-base">
              I couldn&apos;t guess it in {snapshot.questionCount} questions.
              {snapshot.guess && (
                <> My best guess was <span className="font-semibold text-indigo-600">{snapshot.guess.entityName}</span>.</>
              )}
            </p>
          </div>

          {!learned ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-gray-800">Teach me</h3>
              </div>
              <p className="mb-4 text-sm text-gray-500">
                What were you thinking of? I&apos;ll learn from this so I&apos;m smarter next time.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Your answer *</label>
                  <Input
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="e.g. Astronaut, Batman, etc."
                    className="h-11 rounded-xl"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">Description (optional)</label>
                  <Textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="A short hint to help me recognize it next time."
                    className="min-h-[70px] rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleLearn}
                  disabled={loading || !answer.trim()}
                  className="h-11 w-full gap-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  <Send className="h-4 w-4" />
                  {loading ? "Saving..." : "Teach the AI"}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-6 rounded-2xl border-2 border-green-200 bg-green-50 p-5 text-center"
            >
              <Sparkles className="mx-auto mb-2 h-8 w-8 text-green-500" />
              <p className="text-sm font-semibold text-green-700">Learned! Thanks</p>
            </motion.div>
          )}

          <div className="flex justify-center">
            <Button
              onClick={() => { play("start"); onPlayAgain(); }}
              className="h-12 gap-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <RotateCcw className="h-4 w-4" />
              Play Again
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
