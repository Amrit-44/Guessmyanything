"use client";

import Link from "next/link";

interface Props {
  title: string;
  children: React.ReactNode;
}

export function LegalPage({ title, children }: Props) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight text-black transition-colors hover:text-indigo-600">
            GUESS MY ANYTHING
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-8 sm:py-12">
          <h1 className="mb-6 text-2xl font-bold tracking-tight text-black sm:text-3xl">
            {title}
          </h1>
          <div className="space-y-4 text-sm leading-relaxed text-gray-600 sm:text-base">
            {children}
          </div>
          <div className="mt-8">
            <Link
              href="/"
              className="text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-700"
            >
              ← Back to Game
            </Link>
          </div>
        </div>
      </main>

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
