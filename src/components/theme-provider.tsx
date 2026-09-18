"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

// next-themes' no-flash script is rendered via React.createElement("script", ...)
// (already marked suppressHydrationWarning by the library itself). React 19.2+
// added stricter diagnostics for script tags rendered through components and
// flags this as a hydration mismatch even though the script runs correctly
// during the real SSR pass — a confirmed false positive, not a real bug.
// next-themes hasn't shipped a fix (repo inactive since March 2025). Tracked
// upstream: https://github.com/shadcn-ui/ui/issues/10104
//
// This has to run at module scope, not inside a useEffect: hydration (and its
// console.error calls) happens synchronously during the initial render/commit,
// which is BEFORE any component's first effect fires. An effect-scoped patch
// installs too late to catch the very error it's meant to suppress.
// ponytail: console-noise suppression, not a real fix — remove once
// next-themes ships a React-19-compatible script strategy, or if this project
// ever swaps to a hand-rolled next/script(beforeInteractive) theme script.
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const originalError = console.error;
  console.error = (...args: Parameters<typeof console.error>) => {
    // Only the specific known-false-positive message — NOT the generic
    // "Hydration failed" text, which is shared by every real hydration bug
    // too. Filtering that broadly would hide future genuine mismatches.
    const message = typeof args[0] === "string" ? args[0] : "";
    if (message.includes("Encountered a script tag")) {
      return;
    }
    originalError(...args);
  };
}

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
