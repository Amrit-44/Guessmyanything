"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";
import { toast } from "sonner";

const ACTIVE_CATEGORIES = new Set(["jobs", "countries", "animals", "sports"]);

interface Props {
  categories: { slug: string; name: string; description?: string | null; icon?: string | null; color?: string | null; _count: { entities: number } }[];
  totalEntities: number;
}

// Data counts pulled from DB at render time — uses actual entity counts
const CATEGORY_META: Record<string, { emoji: string; label: string; color: string; route: string }> = {
  age:        { emoji: "🎂", label: "GUESS MY AGE",     color: "#8b5cf6", route: "/category/age" },
  jobs:       { emoji: "💼", label: "GUESS MY JOB",     color: "#3b82f6", route: "/category/jobs" },
  animals:    { emoji: "🦁", label: "GUESS MY ANIMAL",  color: "#f97316", route: "/category/animals" },
  countries:  { emoji: "🌍", label: "GUESS MY COUNTRY", color: "#22c55e", route: "/category/countries" },
  sports:     { emoji: "⚽", label: "GUESS MY SPORT",   color: "#ef4444", route: "/category/sports" },
};

const CARD_ORDER = ["age", "jobs", "animals", "countries", "sports"];

// ALL inactive categories shown as Coming Soon
const COMING_SOON = [
  { name: "Characters", emoji: "🎭" },
  { name: "Movies", emoji: "🎬" },
  { name: "TV Shows", emoji: "📺" },
  { name: "Video Games", emoji: "🎮" },
  { name: "Celebrities", emoji: "⭐" },
  { name: "Brands", emoji: "🏷️" },
  { name: "Objects", emoji: "📦" },
  { name: "Historical Figures", emoji: "📜" },
];

export function HomeScreen({ categories, totalEntities }: Props) {
  const router = useRouter();

  // Build a map of slug → entity count from the DB data
  const entityCounts: Record<string, number> = {};
  for (const c of categories) {
    entityCounts[c.slug] = c._count.entities;
  }

  const handlePlay = () => {
    const catSection = document.getElementById("category-section");
    if (catSection) {
      catSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleCategoryClick = (slug: string) => {
    const meta = CATEGORY_META[slug];
    if (meta) router.push(meta.route);
  };

  // Helper to get count label for active categories
  const getCountLabel = (slug: string) => {
    if (slug === "age") return "38 life stages";
    const count = entityCounts[slug];
    if (!count) return "";
    if (slug === "jobs") return `${count} careers`;
    if (slug === "animals") return `${count} species`;
    if (slug === "countries") return `${count} nations`;
    if (slug === "sports") return `${count} sports`;
    return `${count} entries`;
  };

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        body { background: #fafafa; }
        .luxury-bg {
          background: radial-gradient(ellipse at top, #f5f5f7 0%, #ffffff 50%, #fafafa 100%);
        }
        .luxury-card {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, border-color 0.3s ease;
        }
        .luxury-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.10);
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-bold tracking-tight text-black">
            GUESS MY ANYTHING
          </h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="luxury-bg px-6 py-16 text-center sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl"
        >
          <p className="mb-4 text-sm font-medium text-gray-600">
            ✨ AI-POWERED GUESSING ENGINE
          </p>
          <h2 className="mb-6 text-4xl font-bold tracking-tight text-black sm:text-6xl">
            THINK OF ANYTHING
          </h2>
          <button
            onClick={handlePlay}
            className="mb-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl"
          >
            🎯 PLAY NOW <ArrowRight className="h-5 w-5" />
          </button>
          <p className="mx-auto max-w-lg text-base text-gray-600">
            A job, a country, an animal, a sport, or even your own age – pick anything in your mind. I&apos;ll ask clever questions and guess it.
          </p>
        </motion.div>
      </section>

      {/* Category Cards — 5 in a row */}
      <section id="category-section" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-12">
        <h2 className="mb-8 text-center text-2xl font-bold tracking-tight text-gray-900">
          CHOOSE A CATEGORY
        </h2>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-5">
          {CARD_ORDER.map((slug, i) => {
            const meta = CATEGORY_META[slug];
            return (
              <motion.button
                key={slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.4 }}
                onClick={() => handleCategoryClick(slug)}
                className="luxury-card flex flex-col items-center gap-4 rounded-2xl border-2 bg-white p-7 text-center shadow-sm"
                style={{ borderColor: `${meta.color}40` }}
              >
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-2xl text-4xl"
                  style={{ background: `${meta.color}15` }}
                >
                  {meta.emoji}
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: meta.color }}>
                    {meta.label}
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">{getCountLabel(slug)}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Coming Soon Cards — all inactive categories */}
        <div className="mt-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[10px] font-medium text-gray-400">MORE CATEGORIES COMING SOON</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {COMING_SOON.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.3 }}
                className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center opacity-60"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                  {cat.emoji}
                </div>
                <span className="text-[11px] font-medium text-gray-400">{cat.name}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-[8px] font-semibold text-gray-500">
                  <Lock className="h-2.5 w-2.5" /> SOON
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO content */}
      <section className="mx-auto max-w-2xl px-6 py-12 text-center">
        <h2 className="mb-3 text-lg font-semibold text-gray-800">
          The AI-Powered Guessing Game That Reads Your Mind
        </h2>
        <p className="text-sm leading-relaxed text-gray-600">
          Guess My Anything is an AI-powered guessing game that uses life-stage heuristics and massive datasets to read your mind across Jobs, Countries, Animals, Sports, and Age.
        </p>
      </section>

      {/* Footer */}
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
