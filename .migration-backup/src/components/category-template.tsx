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

export interface FAQ { question: string; answer: string; }
export interface CategoryTemplateProps {
  category: string; title: string; description: string; heroBlurb: string;
  faqs: FAQ[]; relatedCategories: { slug: string; name: string; icon: string | null; color: string | null }[];
  totalEntities: number;
}

export function CategoryTemplate({ category, title, description, heroBlurb, faqs, relatedCategories, totalEntities }: CategoryTemplateProps) {
  const isAge = category === "age";
  const game = useGame(); const ageGame = useAgeGame(); const { play } = useSound();
  const prevStatusRef = useRef<string | null>(null);
  const startTriggered = useRef(false);
  useEffect(() => { if (startTriggered.current) return; startTriggered.current = true; if (isAge) ageGame.start(); else game.start(category); }, [category]);
  useEffect(() => { if (isAge || !game.snapshot) return; const s = game.snapshot.status, p = prevStatusRef.current; if (s !== p) { if (s === "guessing" && p === "playing") play("guess"); if (s === "won") play("win"); if (s === "lost" && p !== "lost") play("lose"); prevStatusRef.current = s; } }, [game.snapshot?.status, play, isAge]);
  const handlePlayAgain = () => { if (isAge) ageGame.reset(); else { game.reset(); prevStatusRef.current = null; } setTimeout(() => { startTriggered.current = false; if (isAge) ageGame.start(); else game.start(category); }, 100); };
  const activeSnapshot = isAge ? ageGame.snapshot : game.snapshot;
  const loading = isAge ? ageGame.loading : game.loading;

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex items-center gap-2.5"><img src="/logo.png" alt="Guess My Anything" className="h-8 w-8 rounded-lg sm:h-10 sm:w-10" /><span className="text-base font-bold tracking-tight text-black hover:text-indigo-600 sm:text-lg">GUESS MY ANYTHING</span></Link>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 pt-6"><nav className="flex items-center gap-1 text-xs text-gray-400"><Link href="/" className="flex items-center gap-1 hover:text-indigo-600"><Home className="h-3 w-3" /> Home</Link><ChevronRight className="h-3 w-3" /><span className="font-medium text-gray-700">{title}</span></nav></div>
        {!activeSnapshot && (<div className="mx-auto max-w-3xl px-6 py-12 text-center"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}><p className="mb-3 text-sm font-medium text-gray-500">✨ AI-POWERED</p><h1 className="mb-4 text-3xl font-bold text-black sm:text-4xl">{title}</h1><p className="mx-auto max-w-md text-base text-gray-500">{heroBlurb}</p>{totalEntities > 0 && <p className="mt-3 text-sm font-medium text-indigo-600">{totalEntities.toLocaleString()} entries</p>}<div className="mt-6"><button onClick={handlePlayAgain} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700"><Sparkles className="h-5 w-5" /> START</button></div></motion.div></div>)}
        {activeSnapshot && (<div className="mx-auto max-w-2xl px-4 py-6">{isAge ? <AgeGame onExit={() => ageGame.reset()} /> : activeSnapshot.status === "playing" ? <QuestionScreen snapshot={activeSnapshot} loading={loading} onAnswer={game.answer} onUndo={game.undo} onRestart={game.restart} /> : activeSnapshot.status === "guessing" ? <GuessScreen snapshot={activeSnapshot} loading={loading} onConfirm={game.confirm} /> : <ResultScreen snapshot={activeSnapshot} loading={loading} onRestart={game.restart} onLearn={game.learn} onPlayAgain={handlePlayAgain} />}</div>)}
        <section className="mx-auto max-w-3xl px-6 py-8"><h2 className="mb-3 text-lg font-semibold text-gray-800">About This Game</h2><p className="text-sm text-gray-500">{description}</p></section>
        <section className="mx-auto max-w-3xl px-6 py-8"><h2 className="mb-4 text-lg font-semibold text-gray-800">Frequently Asked Questions</h2><div className="space-y-3">{faqs.map((f, i) => <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h3 className="mb-1 text-sm font-semibold text-indigo-600">{f.question}</h3><p className="text-sm text-gray-500">{f.answer}</p></div>)}</div></section>
        <section className="mx-auto max-w-3xl px-6 py-8"><h2 className="mb-4 text-lg font-semibold text-gray-800">Explore Other Categories</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{relatedCategories.map(c => { const Icon = getCategoryIcon(c.icon); const color = c.color ?? "#3b82f6"; return <Link key={c.slug} href={c.slug === "age" ? "/category/age" : `/category/${c.slug}`} className="rounded-2xl border-2 bg-white p-4 text-center shadow-sm transition-all hover:shadow-md" style={{ borderColor: `${color}40` }}><div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: `${color}15` }}><Icon className="h-6 w-6" style={{ color }} /></div><span className="text-xs font-medium" style={{ color }}>{c.name}</span></Link>; })}</div></section>
      </main>
      <footer className="mt-auto bg-gray-900 px-4 py-4 sm:px-6 sm:py-5"><div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row"><div className="flex items-center gap-2"><img src="/logo.png" alt="Logo" className="h-6 w-6 rounded" /><p className="text-xs text-gray-500">© 2026 Guess My Anything</p></div><nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-500"><Link href="/about" className="hover:text-white">About</Link><span className="hidden text-gray-700 sm:inline">|</span><Link href="/privacy" className="hover:text-white">Privacy</Link><span className="hidden text-gray-700 sm:inline">|</span><Link href="/terms" className="hover:text-white">Terms</Link><span className="hidden text-gray-700 sm:inline">|</span><Link href="/contact" className="hover:text-white">Contact</Link></nav></div></footer>
    </div>
  );
}
