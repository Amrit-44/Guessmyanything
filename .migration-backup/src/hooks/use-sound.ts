"use client";

import { useCallback, useRef, useState } from "react";

/**
 * Arcade sound manager — generates 8-bit style blips via the Web Audio API.
 * No external audio files needed. Honours a global mute toggle persisted
 * to localStorage.
 */

type SoundName =
  | "select"
  | "answer"
  | "correct"
  | "wrong"
  | "guess"
  | "win"
  | "lose"
  | "hover"
  | "tick"
  | "start";

export function useSound() {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = localStorage.getItem("gma-sound");
      return stored === null ? true : stored === "true";
    } catch {
      return true;
    }
  });
  const ctxRef = useRef<AudioContext | null>(null);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("gma-sound", String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const getCtx = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;
    if (ctxRef.current) return ctxRef.current;
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    } catch {
      return null;
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback(
    (
      freq: number,
      duration: number,
      type: OscillatorType = "square",
      gain = 0.08,
      startOffset = 0
    ) => {
      if (!enabled) return;
      try {
        const ctx = getCtx();
        if (!ctx) return;
        if (ctx.state === "suspended") {
          void ctx.resume().catch(() => {});
        }
        const t0 = ctx.currentTime + startOffset;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(0, t0);
        g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
        osc.connect(g);
        g.connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + duration + 0.02);
      } catch {
        /* audio is best-effort; never break app flow */
      }
    },
    [enabled, getCtx]
  );

  const play = useCallback(
    (name: SoundName) => {
      if (!enabled) return;
      try {
      switch (name) {
        case "hover":
          playTone(660, 0.04, "square", 0.03);
          break;
        case "select":
          playTone(523, 0.06, "square", 0.07);
          playTone(784, 0.08, "square", 0.07, 0.05);
          break;
        case "answer":
          playTone(440, 0.05, "square", 0.06);
          playTone(587, 0.07, "square", 0.06, 0.04);
          break;
        case "tick":
          playTone(880, 0.03, "square", 0.04);
          break;
        case "start":
          playTone(392, 0.08, "square", 0.07);
          playTone(523, 0.08, "square", 0.07, 0.08);
          playTone(659, 0.08, "square", 0.07, 0.16);
          playTone(784, 0.18, "square", 0.08, 0.24);
          break;
        case "guess":
          playTone(659, 0.1, "square", 0.08);
          playTone(880, 0.14, "square", 0.08, 0.1);
          break;
        case "correct":
          playTone(523, 0.08, "square", 0.08);
          playTone(659, 0.08, "square", 0.08, 0.08);
          playTone(784, 0.08, "square", 0.08, 0.16);
          playTone(1047, 0.2, "square", 0.09, 0.24);
          break;
        case "wrong":
          playTone(311, 0.12, "sawtooth", 0.07);
          playTone(233, 0.18, "sawtooth", 0.07, 0.1);
          break;
        case "win":
          // victory fanfare
          playTone(523, 0.1, "square", 0.08);
          playTone(659, 0.1, "square", 0.08, 0.1);
          playTone(784, 0.1, "square", 0.08, 0.2);
          playTone(1047, 0.1, "square", 0.09, 0.3);
          playTone(784, 0.08, "square", 0.08, 0.4);
          playTone(1047, 0.3, "square", 0.1, 0.48);
          break;
        case "lose":
          playTone(392, 0.15, "sawtooth", 0.07);
          playTone(311, 0.15, "sawtooth", 0.07, 0.15);
          playTone(262, 0.4, "sawtooth", 0.08, 0.3);
          break;
      }
      } catch {
        /* best-effort */
      }
    },
    [enabled, playTone]
  );

  return { enabled, toggle, play };
}
