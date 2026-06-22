"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, Home, Sparkles } from "lucide-react";
import { useGame } from "@/hooks/use-game";
import { useSound } from "@/hooks/use-sound";
import { useAgeGame } from "@/hooks/use-age-game";
import { QuestionScreen } from "@/components/game/question-screen";
import { GuessScreen } from "@/components/game/guess-screen";
import { ResultScreen } from "@/components/game/result-screen";
import { AgeGame } from "@/components/game/age-game";
import { getCategoryIcon } from "@/lib/category-icons";

export interface FAQ {
  question: string;
  answer: string;
}

export interface CategoryTemplateProps {
  category: string;
  title: string;
  description: string;
  heroBlurb: string;
  faqs: FAQ[];
  relatedCategories: { slug: string; name: string; icon: string | null; color: string | null }[];
  totalEntities: number;
}

export function CategoryTemplate({
  category,
  title,
  description,
  heroBlurb,
  faqs,
  relatedCategories,
  totalEntities,
}: CategoryTemplateProps) {
  const isAge = category === "age";
  const game = useGame();
  const ageGame = useAgeGame();
  const { play } = useSound();
  const prevStatusRef = useRef<string | null>(null);
  const startTriggered = useRef(false);

  // Normalize plural URLs to singular DB category keys safely
  const normalizedCategory = 
    category === "countries" ? "country" :
    category === "animals" ? "animal" :
    category === "movies" ? "movie" :
    category === "sports" ? "sport" :
    category;

  useEffect(() => {
    if (startTriggered.current) return;
    startTriggered.current = true;
    if (isAge) {
      ageGame.start();
    } else {
      game.start(normalizedCategory);
    }
  }, [normalizedCategory, isAge]);

  useEffect(() => {
    if (isAge) return;
    if (!game.snapshot) return;
    const status = game.snapshot.status;
    const prev = prevStatusRef.current;
    if (status !== prev) {
      if (status === "guessing" && prev === "playing") play("guess");
      if (status === "won") play("win");
      if (status === "lost" && prev !== "lost") play("lose");
      prevStatusRef.current = status;
    }
  }, [game.snapshot?.status, play, isAge]);

  const handlePlayAgain = () => {
    if (isAge) {
      ageGame.reset();
    } else {
      game.reset();
      prevStatusRef.current = null;
    }
    setTimeout(() => {
      startTriggered.current = false;
      if (isAge) ageGame.start();
      else game.start(normalizedCategory);
    }, 100);
  };

  const activeSnapshot = isAge ? ageGame.snapshot : game.snapshot;
  const loading = isAge ? ageGame.loading : game.loading;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Guess My Anything" className="h-8 w-8 rounded-lg sm:h-10 sm:w-10" />
            <span className="text-base font-bold tracking-tight text-black transition-colors hover:text-indigo-600 sm:text-lg">
              GUESS MY ANYTHING
            </span>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="mx-auto max-w-3xl px-6 pt-6">
          <nav className="flex items-center gap-1 text-xs text-gray-400">
            <Link href="/" className="flex items-center gap-1 transition-colors hover:text-indigo-600">
              <Home className="h-3 w-3" /> Home
            </Link>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-gray-700">{title}</span>
          </nav>
        </div>

        {/* Hero section (only show before game starts) */}
        {!activeSnapshot && (
          <div className="mx-auto max-w-3xl px-6 py-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <p className="mb-3 text-sm font-medium text-gray-500">✨ AI-POWERED</p>
              <h1 className="mb-4 text-3xl font-bold tracking-tight text-black sm:text-4xl">
                {title}
              </h1>
              <p className="mx-auto max-w-md text-base text-gray-500">
                {heroBlurb}
              </p>
              {totalEntities > 0 && (
                <p className="mt-3 text-sm font-medium text-indigo-600">
                  {totalEntities.toLocaleString()} entries loaded
                </p>
              )}
              <div className="mt-6">
                <button
                  onClick={handlePlayAgain}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl"
                >
                  <Sparkles className="h-5 w-5" /> START
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Game UI */}
        {activeSnapshot && (
          <div className="mx-auto max-w-3xl px-4 py-6">
            {isAge ? (
              <AgeGame onExit={() => { ageGame.reset(); }} />
            ) : activeSnapshot.status === "playing" ? (
              <QuestionScreen
                snapshot={activeSnapshot}
                loading={loading}
                onAnswer={game.answer}
                onUndo={game.undo}
                onRestart={game.restart}
              />
            ) : activeSnapshot.status === "guessing" ? (
              <GuessScreen
                snapshot={activeSnapshot}
                loading={loading}
                onConfirm={game.confirm}
              />
            ) : (
              <ResultScreen
                snapshot={activeSnapshot}
                loading={loading}
                onRestart={game.restart}
                onLearn={game.learn}
                onPlayAgain={handlePlayAgain}
              />
            )}
          </div>
        )}

        {/* SEO: Description */}
        <section className="mx-auto max-w-3xl px-6 py-8">
          <h2 className="mb-3 text-lg font-semibold text-gray-800">About This Game</h2>
          <p className="text-sm leading-relaxed text-gray-500">{description}</p>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-6 py-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-semibold text-indigo-600">{faq.question}</h3>
                <p className="text-sm text-gray-500">{faq.answer}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Categories */}
        <section className="mx-auto max-w-3xl px-6 py-8">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Explore Other Categories</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {relatedCategories.map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              const color = cat.color ?? "#3b82f6";
              return (
                <Link
                  key={cat.slug}
                  href={cat.slug === "age" ? "/category/age" : `/category/${cat.slug}`}
                  className="luxury-card flex flex-col items-center gap-2 rounded-2xl border-2 bg-white p-4 text-center shadow-sm transition-all hover:shadow-md"
                  style={{ borderColor: `${color}40` }}
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: `${color}15` }}
                  >
                    <Icon className="h-6 w-6" style={{ color }} />
                  </div>
                  <span className="text-xs font-medium" style={{ color }}>
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer — matches homepage */}
      <footer className="mt-auto bg-gray-900 px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 sm:flex-row">
          <p className="text-xs text-gray-500">© 2026 Guess My Anything</p>
          <nav className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500">
            <a href="/about" className="transition-colors hover:text-white">About</a>
            <span className="text-gray-700">|</span>
            <a href="/privacy" className="transition-colors hover:text-white">Privacy Policy</a>
            <span className="text-gray-700">|</span>
            <a href="/terms" className="transition-colors hover:text-white">Terms of Service</a>
            <span className="text-gray-700">|</span>
            <a href="/contact" className="transition-colors hover:text-white">Contact Us</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
