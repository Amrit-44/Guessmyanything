import { Link } from "wouter";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex items-center gap-2.5"><img src="/logo.png" alt="Guess My Anything" className="h-8 w-8 rounded-lg sm:h-10 sm:w-10" /><span className="text-base font-bold text-black hover:text-indigo-600 sm:text-lg">GUESS MY ANYTHING</span></Link>
        </div>
      </header>
      <main className="flex-1"><div className="mx-auto max-w-3xl px-6 py-8 sm:py-12"><h1 className="mb-6 text-2xl font-bold text-black sm:text-3xl">{title}</h1><div className="space-y-4 text-sm text-gray-600 sm:text-base">{children}</div><div className="mt-8"><Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">← Back to Game</Link></div></div></main>
      <footer className="mt-auto bg-gray-900 px-4 py-4 sm:px-6 sm:py-5"><div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row"><div className="flex items-center gap-2"><img src="/logo.png" alt="Logo" className="h-6 w-6 rounded" /><p className="text-xs text-gray-500">© 2026 Guess My Anything</p></div><nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-500"><Link href="/about" className="hover:text-white">About</Link><span className="hidden text-gray-700 sm:inline">|</span><Link href="/faq" className="hover:text-white">FAQ</Link><span className="hidden text-gray-700 sm:inline">|</span><Link href="/blog/best-guessing-games" className="hover:text-white">Blog</Link><span className="hidden text-gray-700 sm:inline">|</span><Link href="/privacy" className="hover:text-white">Privacy</Link><span className="hidden text-gray-700 sm:inline">|</span><Link href="/terms" className="hover:text-white">Terms</Link><span className="hidden text-gray-700 sm:inline">|</span><Link href="/contact" className="hover:text-white">Contact</Link></nav></div></footer>
    </div>
  );
}
