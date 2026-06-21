"use client";

import Link from "next/link";
import { Gamepad2 } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t-2 border-primary/30 bg-background/60 px-4 py-6">
      <div className="mx-auto max-w-5xl">
        {/* Brand + intro */}
        <div className="mb-4 flex flex-col items-center gap-2 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-sm border-2 border-primary bg-primary/15">
              <Gamepad2 className="h-4 w-4 neon-pink" />
            </div>
            <div>
              <div className="text-[10px] neon-pink" style={{ fontFamily: "var(--font-pixel)" }}>
                GUESS MY ANYTHING
              </div>
            </div>
          </div>
          <p className="max-w-md text-xs text-muted-foreground">
            Guess My Anything is an AI-powered guessing game that uses life-stage heuristics and massive datasets to read your mind across Jobs, Countries, Animals, Sports, and Age.
          </p>
        </div>

        {/* Navigation links */}
        <div className="flex flex-wrap items-center justify-center gap-3 border-t border-border pt-4 sm:justify-start">
          <Link href="/about" className="text-xs text-muted-foreground transition-colors hover:text-primary">
            About Us
          </Link>
          <span className="text-muted-foreground/30">·</span>
          <Link href="/privacy" className="text-xs text-muted-foreground transition-colors hover:text-primary">
            Privacy Policy
          </Link>
          <span className="text-muted-foreground/30">·</span>
          <Link href="/terms" className="text-xs text-muted-foreground transition-colors hover:text-primary">
            Terms of Service
          </Link>
          <span className="text-muted-foreground/30">·</span>
          <Link href="/contact" className="text-xs text-muted-foreground transition-colors hover:text-primary">
            Contact Us
          </Link>
          <span className="text-muted-foreground/30">·</span>
          <Link href="/imprint" className="text-xs text-muted-foreground transition-colors hover:text-primary">
            Imprint
          </Link>
          <span className="text-muted-foreground/30">·</span>
          <Link href="/cookies" className="text-xs text-muted-foreground transition-colors hover:text-primary">
            Cookie Policy
          </Link>
        </div>

        {/* Copyright */}
        <div className="mt-4 border-t border-border pt-3 text-center">
          <p className="text-[10px] text-muted-foreground" style={{ fontFamily: "var(--font-pixel)" }}>
            GUESS MY ANYTHING &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </footer>
  );
}
