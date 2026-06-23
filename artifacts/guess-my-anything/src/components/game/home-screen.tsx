import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Lock } from "lucide-react";

const ACTIVE_CATEGORIES = new Set(["jobs", "countries", "animals", "sports"]);

interface Props {
  categories: { slug: string; name: string; description?: string | null; icon?: string | null; color?: string | null; _count: { entities: number } }[];
  totalEntities: number;
}

const CATEGORY_META: Record<string, { emoji: string; label: string; color: string; route: string }> = {
  age:        { emoji: "🎂", label: "GUESS MY AGE",     color: "#8b5cf6", route: "/category/age" },
  jobs:       { emoji: "💼", label: "GUESS MY JOB",     color: "#3b82f6", route: "/category/jobs" },
  animals:    { emoji: "🦁", label: "GUESS MY ANIMAL",  color: "#f97316", route: "/category/animals" },
  countries:  { emoji: "🌍", label: "GUESS MY COUNTRY", color: "#22c55e", route: "/category/countries" },
  sports:     { emoji: "⚽", label: "GUESS MY SPORT",   color: "#ef4444", route: "/category/sports" },
};

const CARD_ORDER = ["age", "jobs", "animals", "countries", "sports"];

const COMING_SOON = [
  { name: "Characters", emoji: "🎭" }, { name: "Movies", emoji: "🎬" },
  { name: "TV Shows", emoji: "📺" }, { name: "Video Games", emoji: "🎮" },
  { name: "Celebrities", emoji: "⭐" }, { name: "Brands", emoji: "🏷️" },
  { name: "Objects", emoji: "📦" }, { name: "Historical Figures", emoji: "📜" },
];

export function HomeScreen({ categories, totalEntities }: Props) {
  const [, setLocation] = useLocation();
  const entityCounts: Record<string, number> = {};
  for (const c of categories) entityCounts[c.slug] = c._count.entities;

  const handlePlay = () => {
    const el = document.getElementById("category-section");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCategoryClick = (slug: string) => {
    const meta = CATEGORY_META[slug];
    if (meta) setLocation(meta.route);
  };

  const getCountLabel = (slug: string) => {
    if (slug === "age") return "38 life stages";
    const count = entityCounts[slug]; if (!count) return "";
    if (slug === "jobs") return `${count} careers`;
    if (slug === "animals") return `${count} species`;
    if (slug === "countries") return `${count} nations`;
    if (slug === "sports") return `${count} sports`;
    return `${count} entries`;
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <style>{`body { background: #fafafa; overflow-x: hidden; } .luxury-bg { background: radial-gradient(ellipse at top, #f5f5f7 0%, #ffffff 50%, #fafafa 100%); } .luxury-card { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease; } .luxury-card:hover { transform: translateY(-4px); box-shadow: 0 12px 36px rgba(0,0,0,0.10); } * { max-width: 100%; box-sizing: border-box; }`}</style>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-3 sm:px-6 sm:py-4">
          <img src="/logo.png" alt="Guess My Anything" className="h-8 w-8 rounded-lg sm:h-10 sm:w-10" />
          <h1 className="text-base font-bold tracking-tight text-black sm:text-lg">GUESS MY ANYTHING</h1>
        </div>
      </header>

      {/* Hero */}
      <section className="luxury-bg px-4 py-12 text-center sm:px-6 sm:py-16 lg:py-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mx-auto max-w-2xl">
          <p className="mb-3 text-xs font-medium text-gray-600 sm:mb-4 sm:text-sm">✨ AI-POWERED GUESSING ENGINE</p>
          <h2 className="mb-5 text-3xl font-bold leading-tight tracking-tight text-black sm:mb-6 sm:text-5xl lg:text-6xl">THINK OF ANYTHING</h2>
          <button onClick={handlePlay} className="mb-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl sm:mb-6 sm:w-auto sm:px-8 sm:py-4 sm:text-base">🎯 PLAY NOW <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" /></button>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-gray-600 sm:max-w-lg sm:text-base">A job, a country, an animal, a sport, or even your own age – pick anything in your mind. I&apos;ll ask clever questions and guess it.</p>
        </motion.div>
      </section>

      {/* Category Cards */}
      <section id="category-section" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-8 sm:scroll-mt-20 sm:px-6 sm:py-12">
        <h2 className="mb-6 text-center text-xl font-bold tracking-tight text-gray-900 sm:mb-8 sm:text-2xl">CHOOSE A CATEGORY</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-5 lg:gap-5">
          {CARD_ORDER.map((slug, i) => {
            const meta = CATEGORY_META[slug];
            return (
              <motion.button key={slug} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06, duration: 0.35 }} onClick={() => handleCategoryClick(slug)} className="luxury-card flex min-h-[44px] flex-col items-center gap-3 rounded-2xl border-2 bg-white p-4 text-center shadow-sm sm:p-5 lg:p-6" style={{ borderColor: `${meta.color}40` }}>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl sm:h-16 sm:w-16 sm:text-4xl lg:h-20 lg:w-20" style={{ background: `${meta.color}15` }}>{meta.emoji}</div>
                <div>
                  <h3 className="text-xs font-bold sm:text-sm lg:text-base" style={{ color: meta.color }}>{meta.label}</h3>
                  <p className="mt-1 text-[11px] text-gray-500 sm:text-xs lg:text-sm">{getCountLabel(slug)}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Coming Soon */}
        <div className="mt-8 sm:mt-10">
          <div className="mb-4 flex items-center gap-3"><div className="h-px flex-1 bg-gray-200" /><span className="text-[10px] font-medium text-gray-400 sm:text-xs">MORE CATEGORIES COMING SOON</span><div className="h-px flex-1 bg-gray-200" /></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:grid-cols-8">
            {COMING_SOON.map((cat, i) => (
              <motion.div key={cat.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.04, duration: 0.3 }} className="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-center opacity-60 sm:p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-xl sm:h-12 sm:w-12 sm:text-2xl">{cat.emoji}</div>
                <span className="text-[10px] font-medium text-gray-400 sm:text-xs">{cat.name}</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-[8px] font-semibold text-gray-500 sm:text-[9px]"><Lock className="h-2.5 w-2.5" /> SOON</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO */}
      <section className="mx-auto max-w-2xl px-4 py-8 text-center sm:px-6 sm:py-12">
        <h2 className="mb-3 text-base font-semibold text-gray-800 sm:text-lg">The AI-Powered Guessing Game That Reads Your Mind</h2>
        <p className="text-sm leading-relaxed text-gray-600">Guess My Anything is an AI-powered guessing game that uses life-stage heuristics and massive datasets to read your mind across Jobs, Countries, Animals, Sports, and Age.</p>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-gray-900 px-4 py-4 sm:px-6 sm:py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row sm:gap-2">
          <div className="flex items-center gap-2"><img src="/logo.png" alt="Logo" className="h-6 w-6 rounded" /><p className="text-xs text-gray-500">© 2026 Guess My Anything</p></div>
          <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-500">
            <a href="/about" className="transition-colors hover:text-white">About</a><span className="hidden text-gray-700 sm:inline">|</span>
            <a href="/privacy" className="transition-colors hover:text-white">Privacy Policy</a><span className="hidden text-gray-700 sm:inline">|</span>
            <a href="/terms" className="transition-colors hover:text-white">Terms of Service</a><span className="hidden text-gray-700 sm:inline">|</span>
            <a href="/contact" className="transition-colors hover:text-white">Contact Us</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
