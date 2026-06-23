import { Link } from "wouter";
import { Gamepad2 } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-gray-900 px-4 py-4 sm:px-6 sm:py-5">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row sm:gap-2">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-6 w-6 rounded" />
          <p className="text-xs text-gray-500">© 2026 Guess My Anything</p>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-gray-500">
          <Link href="/about" className="transition-colors hover:text-white">About</Link>
          <span className="hidden text-gray-700 sm:inline">|</span>
          <Link href="/faq" className="transition-colors hover:text-white">FAQ</Link>
          <span className="hidden text-gray-700 sm:inline">|</span>
          <Link href="/blog/best-guessing-games" className="transition-colors hover:text-white">Blog</Link>
          <span className="hidden text-gray-700 sm:inline">|</span>
          <Link href="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link>
          <span className="hidden text-gray-700 sm:inline">|</span>
          <Link href="/terms" className="transition-colors hover:text-white">Terms of Service</Link>
          <span className="hidden text-gray-700 sm:inline">|</span>
          <Link href="/contact" className="transition-colors hover:text-white">Contact Us</Link>
        </nav>
      </div>
    </footer>
  );
}
