"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Trophy, Frown, Share2, RotateCcw, Brain, Send, Sparkles } from "lucide-react";
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
      ? `GUESS MY ANYTHING beat me in ${snapshot.questionCount} questions! The AI guessed "${snapshot.guess?.entityName ?? ""}" correctly. Can you stump it?`
      : `I stumped GUESS MY ANYTHING! The AI couldn't guess what I was thinking. Think you can do better?`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "GUESS MY ANYTHING", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
      }
    } catch {
      /* user cancelled */
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
    <div className="mx-auto w-full max-w-2xl px-3 py-6 sm:px-4 sm:py-10">
      {won ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, type: "spring", bounce: 0.4 }}
          className="text-center"
        >
          {/* Confetti-ish sparkles */}
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
                <Sparkles className="h-4 w-4 neon-yellow" />
              </motion.div>
            ))}
            <Trophy className="mx-auto h-20 w-20 neon-yellow flicker sm:h-24 sm:w-24" />
          </div>

          <h2
            className="mb-2 text-2xl neon-green sm:text-4xl"
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            I GOT IT!
          </h2>
          <p className="mb-1 text-sm text-foreground/70">
            Your answer was
          </p>
          <p
            className="mb-4 text-3xl neon-pink sm:text-5xl"
            style={{ fontFamily: "var(--font-pixel)" }}
          >
            {snapshot.guess?.entityName}
          </p>
          <div className="mb-6 inline-flex items-center gap-2 rounded-sm border border-border bg-muted/30 px-4 py-2 text-sm">
            <Brain className="h-4 w-4 neon-cyan" />
            Guessed in <span className="neon-cyan">{snapshot.questionCount}</span> questions
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              onClick={() => {
                play("start");
                onPlayAgain();
              }}
              className="pixel-btn h-12 gap-2 rounded-sm bg-primary text-primary-foreground"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              <RotateCcw className="h-4 w-4" />
              PLAY AGAIN
            </Button>
            <Button
              onClick={handleShare}
              variant="outline"
              className="pixel-btn h-12 gap-2 rounded-sm border-2 border-[var(--neon-cyan)] text-[var(--neon-cyan)]"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              <Share2 className="h-4 w-4" />
              SHARE
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
              <Frown className="mx-auto mb-3 h-20 w-20 neon-pink sm:h-24 sm:w-24" />
            </motion.div>
            <h2
              className="mb-2 text-2xl neon-pink sm:text-4xl"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              YOU STUMPED ME!
            </h2>
            <p className="text-sm text-foreground/70 sm:text-base">
              I couldn&apos;t guess it in {snapshot.questionCount} questions.
              {snapshot.guess && (
                <>
                  {" "}
                  My best guess was{" "}
                  <span className="neon-cyan">{snapshot.guess.entityName}</span>.
                </>
              )}
            </p>
          </div>

          {!learned ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="pixel-card mb-6 rounded-sm p-5 sm:p-6"
            >
              <div className="mb-3 flex items-center gap-2">
                <Brain className="h-4 w-4 neon-cyan" />
                <h3 className="text-sm neon-cyan" style={{ fontFamily: "var(--font-pixel)" }}>
                  TEACH ME
                </h3>
              </div>
              <p className="mb-4 text-sm text-foreground/70">
                What were you thinking of? I&apos;ll learn from this so I&apos;m
                smarter next time.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-[10px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel)" }}>
                    YOUR ANSWER *
                  </label>
                  <Input
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="e.g. Astronaut, Batman, etc."
                    className="h-11"
                    style={{ fontFamily: "var(--font-retro)" }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel)" }}>
                    DESCRIPTION (OPTIONAL)
                  </label>
                  <Textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="A short hint to help me recognize it next time."
                    className="min-h-[70px]"
                    style={{ fontFamily: "var(--font-retro)" }}
                  />
                </div>
                <Button
                  onClick={handleLearn}
                  disabled={loading || !answer.trim()}
                  className="pixel-btn h-11 w-full gap-2 rounded-sm bg-primary text-primary-foreground"
                  style={{ fontFamily: "var(--font-pixel)" }}
                >
                  <Send className="h-4 w-4" />
                  {loading ? "SAVING..." : "TEACH THE AI"}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pixel-card mb-6 rounded-sm border-2 border-[var(--neon-green)] p-5 text-center"
            >
              <Sparkles className="mx-auto mb-2 h-8 w-8 neon-green" />
              <p className="text-sm neon-green" style={{ fontFamily: "var(--font-pixel)" }}>
                LEARNED! THANKS
              </p>
            </motion.div>
          )}

          <div className="flex justify-center">
            <Button
              onClick={() => {
                play("start");
                onPlayAgain();
              }}
              className="pixel-btn h-12 gap-2 rounded-sm bg-primary text-primary-foreground"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              <RotateCcw className="h-4 w-4" />
              PLAY AGAIN
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
