"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { KEYMAP } from "@/lib/keymap";

const SEQUENCE_TIMEOUT_MS = 1000;

type Props = {
  onOpenPalette: () => void;
};

/**
 * Global keyboard handler. Supports:
 * - Single keys: "/", "?"
 * - Modifier+key: "$mod+k" (Cmd on macOS, Ctrl elsewhere)
 * - Two-key sequences: "g d", "n e"
 *
 * Mounts at the app shell level. Ignores key events originating in text inputs.
 */
export function KeyboardShortcuts({ onOpenPalette }: Props) {
  const router = useRouter();
  const sequenceRef = useRef<{ key: string; expires: number } | null>(null);

  useEffect(() => {
    function isEditable(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      );
    }

    function dispatch(target: (typeof KEYMAP)[number]["target"]) {
      if (target.type === "navigate") {
        router.push(target.href);
      } else if (target.type === "action") {
        if (target.id === "open-palette") {
          onOpenPalette();
          return;
        }
        window.dispatchEvent(new CustomEvent(`palette:${target.id}`));
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      // Modifier combos: $mod+k → ⌘K (mac) / ^K (win/linux)
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        onOpenPalette();
        return;
      }

      // Don't intercept while typing.
      if (isEditable(e.target)) return;

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const now = Date.now();

      // Check for a sequence in progress
      const pending = sequenceRef.current;
      if (pending && pending.expires > now) {
        const combo = `${pending.key} ${e.key}`;
        const match = KEYMAP.find((k) => k.keys === combo);
        sequenceRef.current = null;
        if (match) {
          e.preventDefault();
          dispatch(match.target);
        }
        return;
      }

      // Single-key shortcuts (/, ?, etc.)
      const single = KEYMAP.find(
        (k) => k.keys === e.key && !k.keys.includes(" ") && !k.keys.startsWith("$mod"),
      );
      if (single) {
        e.preventDefault();
        dispatch(single.target);
        return;
      }

      // Start a sequence if this key is the prefix of any 2-key shortcut
      const couldStart = KEYMAP.some((k) => k.keys.startsWith(`${e.key} `));
      if (couldStart) {
        sequenceRef.current = { key: e.key, expires: now + SEQUENCE_TIMEOUT_MS };
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router, onOpenPalette]);

  return null;
}
