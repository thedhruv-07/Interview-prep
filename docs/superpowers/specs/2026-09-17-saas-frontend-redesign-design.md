# SaaS Frontend Redesign — Design Spec

Date: 2026-09-17

## Goal

Redesign the entire frontend (landing page, nav/layout shell, setup, practice,
dashboard) so the app reads as a polished, professional SaaS product rather
than a plain functional MVP — while changing zero backend behavior (auth,
RLS, question generation, scoring all stay exactly as they are).

## References and how they're used

Two visual references were supplied by the user, both incompatible with this
codebase as literal code:

- **inspira-ui** (`unovue/inspira-ui`) — Vue/Nuxt-only, copy-paste components
  built on shadcn-vue. Cannot be installed in a React project.
- **21st.dev "Shinken Karate" template** — a Framer template (no-code tool,
  separate hosting/export model), with martial-arts-dojo content unrelated to
  this app.

Both are used as **mood-board references only** (bold/modern, premium scroll
easing, polished micro-interactions) — no code or content is imported from
either. Everything is rebuilt from scratch in React/Tailwind.

Two references ARE directly usable and are the actual implementation tools:

- **animate-ui** (`imskyleen/animate-ui`) — React + TypeScript + Tailwind +
  Motion. Installed via shadcn/ui's CLI pattern (it publishes a shadcn-style
  component registry), not as a single npm package.
- **lenis** (`darkroomengineering/lenis`) — framework-agnostic smooth-scroll
  library with a first-class React integration.

## Non-goals

- No changes to `src/lib/ai.ts`, `src/lib/supabase.ts`, API routes, or
  `supabase/schema.sql` — this is presentation-layer only.
- No new pages or features beyond what exists today (home, setup, practice,
  dashboard) — this is a visual redesign of existing flows, not new scope.
- No automated visual regression tests — this project has no test suite
  today; verification is manual via `npm run dev` + browser + `npm run build`
  for type/compile correctness, consistent with how the rest of this project
  has been verified so far.

## Architecture

1. **shadcn/ui foundation**: `npx shadcn@latest init` — sets up
   `components.json`, `src/components/ui/`, and converts `globals.css` to
   shadcn's CSS-variable/OKLCH token system (compatible with the project's
   existing Tailwind v4 CSS-first config, no `tailwind.config.js` needed).
   This also fixes the current dangling `--font-geist-sans` reference in
   `globals.css` (declared but never loaded — body currently hard-falls-back
   to Arial) by properly loading Geist via `next/font/google` in
   `layout.tsx`.
2. **Theme toggle**: `next-themes` package, wrapping the app in
   `layout.tsx`. Chosen over hand-rolling because a correct no-flash toggle
   (matching SSR output to avoid hydration mismatch, blocking inline script
   before paint) is fiddly to get right by hand and this is a small,
   well-established dependency that solves it correctly.
3. **Smooth scroll**: `lenis` + its React wrapper, added once in
   `layout.tsx` around `{children}`. Must not break in-page anchor links,
   `position: sticky` nav, or keyboard/screen-reader scroll behavior — Lenis
   preserves native scroll semantics by design, but this gets a manual check
   during verification (Tab-key navigation, anchor jumps).
4. **animate-ui components**: added individually via the shadcn CLI
   registry pattern (`npx shadcn add <animate-ui-component-url>`) as needed
   per page, not bulk-imported. Keeps the diff per component reviewable and
   avoids pulling in animation code nothing uses.

## Design tokens

- **Typography**: Geist (already referenced, now actually loaded) for body
  text. Headings get tight letter-spacing + bold weight rather than a second
  font family.
- **Color — light**: near-white background, near-black foreground, indigo-
  violet accent (~`#6366f1`) for primary/CTA elements.
- **Color — dark**: soft charcoal background (not pure black), off-white
  foreground, same accent hue brightened slightly for contrast on dark.
- Tokens follow shadcn's standard set (`--background`, `--foreground`,
  `--primary`, `--card`, `--border`, etc.) so future components inherit
  theming automatically instead of re-deriving colors per component.

## Per-page design

### Layout / nav (`src/app/layout.tsx`)
- Sticky nav bar with a blurred/glass background on scroll.
- Theme toggle button (sun/moon) using `next-themes`.
- `ThemeProvider` and Lenis smooth-scroll wrapper added here, once, for the
  whole app.
- Keep existing `<Show when="signed-in">` / `signed-out` Clerk structure —
  only the visual chrome changes, not the auth logic.

### Landing (`src/app/page.tsx`)
- Hero section: animated gradient/text treatment on the headline, a subtle
  animated background (e.g. dot-grid or soft gradient blob), magnetic/glow
  hover states on the primary CTA button.
- Scroll-reveal on feature/value-prop sections below the fold as the user
  scrolls (Lenis-driven or IntersectionObserver-based reveal via an
  animate-ui primitive).
- This is the one page that earns heavy motion — it's the page that has to
  "sell" the product.

### Setup (`src/app/setup/page.tsx`)
- Polish over motion: refined card elevation/shadow, better field spacing,
  clearer visual hierarchy between the company/role inputs and the two large
  textareas.
- The existing "Upload PDF instead" control gets restyled to match (still
  the same upload-or-paste behavior, no functional change).
- Deliberately light on animation — this is a data-entry flow; heavy motion
  here would slow the user down, not help them.

### Practice (`src/app/practice/[applicationId]/page.tsx`)
- Question-to-question transitions (slide/fade) when moving between
  questions.
- A deliberate score-reveal animation when scoring feedback comes back
  (e.g. an animated count-up on the score number) instead of the score just
  appearing instantly — this is the payoff moment in the flow.

### Dashboard (`src/app/dashboard/page.tsx`)
- Score cards get hover elevation and a more deliberate visual hierarchy
  (score, role/company, weak areas) than the current flat list.
- Scroll-reveal as the session list renders in.

## Error handling / edge cases to verify

- Theme toggle: no hydration mismatch warnings in the browser console on
  first load in both light and dark system-preference states.
- Lenis: anchor links, `Tab`-key focus scroll, and the existing Clerk
  sign-in/sign-up modal flows still work with smooth scroll active.
- Existing loading/error states (setup submission errors, scoring failures,
  empty dashboard state) keep working exactly as before — only their visual
  styling changes, not their logic or copy.

## Verification approach

- `npm run build` after each page's changes to catch type errors early
  (this project has caught real integration bugs this way earlier in the
  session — cheap and fast to run).
- Manual browser walkthrough of all 5 screens in both light and dark mode
  after implementation, using the same real Clerk/Supabase/Gemini
  credentials already configured in `.env.local`.
