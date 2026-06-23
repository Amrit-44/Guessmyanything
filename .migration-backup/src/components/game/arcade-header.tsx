"use client";

import { Volume2, VolumeX, Sun, Moon, Shield, Gamepad2 } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

interface Props {
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenAdmin: () => void;
  compact?: boolean;
}

export function ArcadeHeader({
  soundEnabled,
  onToggleSound,
  onOpenAdmin,
  compact,
}: Props) {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-primary/40 bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm border-2 border-primary bg-primary/15 sm:h-10 sm:w-10">
            <Gamepad2 className="h-5 w-5 neon-pink sm:h-6 sm:w-6" />
          </div>
          <div className="leading-none">
            <h1
              className="neon-pink text-[11px] leading-tight sm:text-sm"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              GUESS MY
            </h1>
            <h1
              className="neon-cyan text-[11px] leading-tight sm:text-sm"
              style={{ fontFamily: "var(--font-pixel)" }}
            >
              ANYTHING
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {!compact && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className="h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSound}
            aria-label={soundEnabled ? "Mute sounds" : "Enable sounds"}
            className="h-9 w-9"
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 neon-cyan" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenAdmin}
            aria-label="Admin panel"
            className="h-9 w-9"
          >
            <Shield className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
}
