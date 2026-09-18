# SaaS Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all 5 screens of interview-prep-copilot (landing, nav shell, setup, practice, dashboard) into a polished light/dark SaaS look using shadcn/ui's token system, animate-ui components, and lenis smooth scroll — with zero backend/API/schema changes.

**Architecture:** `shadcn@latest init` establishes the CSS-variable token system and `src/lib/utils.ts`. Two real `animate-ui` registry components (theme toggler button, gradient background) are added via the shadcn CLI, which also pulls in their real dependencies (`next-themes`, `motion`, `lucide-react`, `class-variance-authority`). Everything else the spec calls for (scroll-reveal, magnetic CTA, score count-up, question transitions, card hover) is hand-built directly with `motion` — animate-ui's own underlying engine — as small shared components, since no verified pre-built animate-ui registry component exists for those specific effects (checked directly against the library's GitHub registry file listing, not guessed).

**Tech Stack:** Next.js 16 / React 19 / Tailwind v4 (existing), shadcn/ui CLI v4, `next-themes`, `motion`, `lenis` + `lenis/react`, `lucide-react`.

**Spec:** `docs/superpowers/specs/2026-09-17-saas-frontend-redesign-design.md`

**Note on git:** This project has no `.git` directory. Every task below has a "Commit" step per the standard plan format — if git isn't initialized by the time execution starts, skip the `git add`/`git commit` commands in each step (the code changes still apply) and let the user know at the end that nothing was committed.

---

### Task 1: Initialize shadcn/ui and fix the dangling Geist font reference

**Files:**
- Create: `components.json`, `src/lib/utils.ts` (created by the CLI)
- Modify: `src/app/globals.css` (created/modified by the CLI, then hand-edited)
- Modify: `src/app/layout.tsx:1-16` (font loading)

- [ ] **Step 1: Run the shadcn init CLI**

Run: `npx shadcn@latest init -d -y`

This uses `--defaults` (template=next, preset=base-nova — confirmed via `npx shadcn@latest init --preset` that "Nova" is `Lucide / Geist`, which matches this project's desired icon/font choice exactly) and `--yes` to skip confirmation prompts.

Expected output: creates `components.json` and `src/lib/utils.ts`, rewrites `src/app/globals.css` to shadcn's `@theme inline` + OKLCH CSS-variable token format, and adds `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`, `lucide-react` to `package.json`.

- [ ] **Step 2: Verify the init output**

Run: `cat src/app/globals.css`
Expected: file now contains `:root { --background: oklch(...); --foreground: oklch(...); --primary: oklch(...); ... }` and a `.dark { ... }` block with the same variable names, plus a `@theme inline` block mapping `--color-*` to these variables.

Run: `cat components.json`
Expected: valid JSON with `"tailwind": { "css": "src/app/globals.css", ... }` and `"aliases": { "components": "@/components", "utils": "@/lib/utils", ... }`.

If either file doesn't match this shape, stop and report what's different before continuing — later tasks assume this exact structure.

- [ ] **Step 3: Override the color tokens with the project's indigo/violet-on-charcoal palette**

Open `src/app/globals.css`. In the `:root` block, replace these four lines (keep every other variable the CLI generated as-is):

```css
--background: oklch(0.99 0 0);
--foreground: oklch(0.145 0 0);
--primary: oklch(0.55 0.22 275);
--primary-foreground: oklch(0.98 0 0);
```

In the `.dark` block, replace the same four:

```css
--background: oklch(0.16 0.005 285);
--foreground: oklch(0.96 0 0);
--primary: oklch(0.65 0.24 275);
--primary-foreground: oklch(0.15 0 0);
```

(Hue 275 is indigo/violet in OKLCH; the dark background is a soft charcoal rather than pure black per the spec.)

- [ ] **Step 4: Fix Geist font loading in the root layout**

`src/app/layout.tsx` currently has no `next/font` import at all, despite `globals.css` referencing `--font-geist-sans`/`--font-geist-mono` — body text has been silently falling back to hardcoded Arial. Add this import near the top of `src/app/layout.tsx`, right after the `Metadata` import:

```tsx
import { Geist, Geist_Mono } from "next/font/google";
```

Add these two constants right after the imports, before `export const metadata`:

```tsx
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
```

(The `<html>` tag wiring for these variables happens in Task 5, alongside the rest of the layout rewrite — don't edit the `<html>`/`<body>` tags yet in this step, just get the font objects defined.)

- [ ] **Step 5: Build to verify**

Run: `npm run build`
Expected: compiles clean, 0 errors. (The `geistSans`/`geistMono` constants being unused at this point will NOT cause a build error in Next.js/TypeScript — unused top-level consts aren't flagged the way unused local variables are — but confirm the build is still clean before moving on.)

- [ ] **Step 6: Commit**

```bash
git add components.json src/lib/utils.ts src/app/globals.css src/app/layout.tsx package.json package-lock.json
git commit -m "chore: init shadcn/ui, set brand color tokens, fix Geist font loading"
```

---

### Task 2: Add the two verified animate-ui components

**Files:**
- Create: `src/components/animate-ui/components/buttons/theme-toggler.tsx` (and its registry dependencies, created by the CLI)
- Create: `src/components/animate-ui/components/backgrounds/gradient.tsx` (created by the CLI)

- [ ] **Step 1: Add the theme toggler button**

Run: `npx shadcn@latest add https://animate-ui.com/r/components-buttons-theme-toggler.json`

Expected: installs `next-themes`, `class-variance-authority`, `lucide-react` (if not already present from Task 1) plus its own registry dependencies (`@animate-ui/primitives-effects-theme-toggler`, `@animate-ui/components-buttons-icon`), and writes the component files under `src/components/animate-ui/`.

- [ ] **Step 2: Add the gradient background**

Run: `npx shadcn@latest add https://animate-ui.com/r/components-backgrounds-gradient.json`

Expected: installs `motion` as a dependency, writes `src/components/animate-ui/components/backgrounds/gradient.tsx` (or similar path — confirm with the next step).

- [ ] **Step 3: Verify both components landed**

Run: `find src/components/animate-ui -type f`
Expected: files exist under both `components/buttons/theme-toggler/` and `components/backgrounds/gradient/` (exact subpath may vary slightly by CLI version — note the real paths, they're needed for imports in later tasks).

Run: `grep -E '"motion"|"next-themes"|"lucide-react"' package.json`
Expected: all three present in dependencies.

- [ ] **Step 4: Build to verify**

Run: `npm run build`
Expected: compiles clean, 0 errors (these components aren't imported anywhere yet, so this just confirms they don't break the build by existing).

- [ ] **Step 5: Commit**

```bash
git add src/components/animate-ui package.json package-lock.json
git commit -m "feat: add animate-ui theme toggler button and gradient background"
```

---

### Task 3: Wire up the theme provider

**Files:**
- Create: `src/components/theme-provider.tsx`

- [ ] **Step 1: Create the theme provider wrapper**

Create `src/components/theme-provider.tsx`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

(This thin wrapper exists because `layout.tsx` needs to stay usable as a Server Component boundary — `next-themes`' provider must run client-side, so it's isolated in its own `"use client"` file, the standard Next.js App Router pattern.)

- [ ] **Step 2: Build to verify**

Run: `npm run build`
Expected: compiles clean, 0 errors (not wired into layout yet — that's Task 5).

- [ ] **Step 3: Commit**

```bash
git add src/components/theme-provider.tsx
git commit -m "feat: add next-themes provider wrapper"
```

---

### Task 4: Add Lenis smooth scroll

**Files:**
- Modify: `package.json` (new dependency)

- [ ] **Step 1: Install lenis**

Run: `npm install lenis`

- [ ] **Step 2: Build to verify**

Run: `npm run build`
Expected: compiles clean, 0 errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add lenis smooth scroll dependency"
```

(Lenis gets wired into the layout directly in Task 5 — no separate wrapper file needed, `lenis/react` exports a ready-to-use `<ReactLenis>` component.)

---

### Task 5: Rebuild the root layout (nav, providers, smooth scroll)

**Files:**
- Modify: `src/app/layout.tsx` (full replacement)

- [ ] **Step 1: Replace `src/app/layout.tsx` in full**

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Interview Prep Copilot",
  description: "JD-specific interview practice, generated from your resume.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`h-full antialiased ${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ReactLenis root>
              <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-md">
                <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-3">
                  <Link href="/" className="font-semibold tracking-tight text-foreground">
                    Interview Prep Copilot
                  </Link>
                  <nav className="flex items-center gap-4">
                    <Show when="signed-in">
                      <Link
                        href="/setup"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        New Practice
                      </Link>
                      <Link
                        href="/dashboard"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Dashboard
                      </Link>
                      <UserButton />
                    </Show>
                    <Show when="signed-out">
                      <SignInButton>
                        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                          Sign in
                        </button>
                      </SignInButton>
                      <SignUpButton>
                        <button className="text-sm rounded-full bg-primary px-4 py-1.5 text-primary-foreground hover:opacity-90 transition-opacity">
                          Sign up
                        </button>
                      </SignUpButton>
                    </Show>
                    <ThemeTogglerButton variant="ghost" size="icon" modes={["light", "dark"]} />
                  </nav>
                </div>
              </header>
              <main className="flex-1">{children}</main>
            </ReactLenis>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

Note: `variant="ghost"` and `size="icon"` are passed to `ThemeTogglerButton` because it forwards `VariantProps<typeof buttonVariants>` from the animate-ui icon button primitive it's built on — if the build fails on these specific props, open the actual installed file at `src/components/animate-ui/components/buttons/theme-toggler/index.tsx` (path confirmed in Task 2) and check its real prop names/defaults, then adjust.

- [ ] **Step 2: Build to verify**

Run: `npm run build`
Expected: compiles clean, 0 errors, all 7 routes still registered.

- [ ] **Step 3: Manual check — no hydration warnings**

Run `npm run dev`, open `http://localhost:3000` in a browser, open devtools console.
Expected: no red hydration mismatch warnings. Toggle the theme button — background/foreground/nav colors should switch between light and dark instantly, persisting on refresh.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "feat: redesign nav with sticky glass header, theme toggle, smooth scroll"
```

---

### Task 6: Shared animation components

**Files:**
- Create: `src/components/scroll-reveal.tsx`
- Create: `src/components/magnetic-button.tsx`
- Create: `src/components/animated-counter.tsx`

These three are used across 3+ of the remaining page tasks each, so they're built once here rather than duplicated per page.

- [ ] **Step 1: Create the scroll-reveal wrapper**

Create `src/components/scroll-reveal.tsx`:

```tsx
"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export function ScrollReveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={variants}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Create the magnetic button**

Create `src/components/magnetic-button.tsx`:

```tsx
"use client";

import { useRef, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function MagneticButton({
  children,
  className,
  ...props
}: React.ComponentProps<"button"> & { children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - rect.width / 2) * 0.3;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
    setOffset({ x, y });
  }

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: "spring", stiffness: 150, damping: 12 }}
      className={cn(
        "rounded-full bg-primary px-6 py-3 text-primary-foreground font-medium shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
```

- [ ] **Step 3: Create the animated counter (score count-up)**

Create `src/components/animated-counter.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, useTransform, motion } from "motion/react";

export function AnimatedCounter({ value }: { value: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const controls = animate(count, value, { duration: 1, ease: "easeOut" });
    return () => controls.stop();
  }, [value, count]);

  return <motion.span>{rounded}</motion.span>;
}
```

- [ ] **Step 4: Build to verify**

Run: `npm run build`
Expected: compiles clean, 0 errors (not imported anywhere yet).

- [ ] **Step 5: Commit**

```bash
git add src/components/scroll-reveal.tsx src/components/magnetic-button.tsx src/components/animated-counter.tsx
git commit -m "feat: add shared scroll-reveal, magnetic-button, animated-counter components"
```

---

### Task 7: Redesign the landing page

**Files:**
- Modify: `src/app/page.tsx` (full replacement)

- [ ] **Step 1: Replace `src/app/page.tsx` in full**

```tsx
import Link from "next/link";
import { Show, SignUpButton } from "@clerk/nextjs";
import { GradientBackground } from "@/components/animate-ui/components/backgrounds/gradient";
import { MagneticButton } from "@/components/magnetic-button";
import { ScrollReveal } from "@/components/scroll-reveal";

const FEATURES = [
  {
    title: "Gap-anchored questions",
    body: "Not a generic question bank — every question ties back to a specific line in your resume or a specific requirement in the job description.",
  },
  {
    title: "Real scoring, not vibes",
    body: "Answers are scored on specificity, relevance, and structure, with concrete feedback on exactly what to add or cut.",
  },
  {
    title: "Track weak areas over time",
    body: "Your dashboard aggregates scores and recurring weak areas across every application you practice for.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <GradientBackground className="absolute inset-0 opacity-20 dark:opacity-30" />
        <div className="relative mx-auto max-w-3xl px-6 py-28 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            Practice for the interview you actually have.
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Paste your resume and a job description. Get interview questions built
            from the specific gaps and overlaps between them — then practice and
            get scored, not just a generic question bank.
          </p>
          <div className="mt-10 flex justify-center">
            <Show when="signed-out">
              <SignUpButton>
                <MagneticButton>Get started</MagneticButton>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link
                href="/setup"
                className="rounded-full bg-primary px-6 py-3 text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                Start a new practice session
              </Link>
            </Show>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 0.1}>
              <div className="rounded-2xl border border-border bg-card p-6 h-full">
                <h3 className="font-semibold text-card-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>
    </div>
  );
}
```

(The signed-in case stays a plain styled `<Link>`, not a `MagneticButton`, because Next's `<Link>` renders its own `<a>` around children — nesting a `<button>`-rendering component inside it would produce invalid `<button>`-inside-`<a>` HTML. The signed-out case is a real `<button>` via Clerk's `<SignUpButton>` trigger, so it's safe to make magnetic.)

- [ ] **Step 2: Build to verify**

Run: `npm run build`
Expected: compiles clean, 0 errors.

- [ ] **Step 3: Manual check**

Run `npm run dev`, open `http://localhost:3000` signed out.
Expected: gradient background slowly animates behind the hero, "Get started" button visibly shifts toward the cursor on hover, feature cards fade/slide in as you scroll to them.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: redesign landing page with animated hero and scroll-reveal features"
```

---

### Task 8: Redesign the setup page

**Files:**
- Modify: `src/app/setup/page.tsx` (full replacement)

- [ ] **Step 1: Replace `src/app/setup/page.tsx` in full**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsingResume, setParsingResume] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResumeFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setParsingResume(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);
      const res = await fetch("/api/resume/parse", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not read PDF");
      setResumeText(data.text);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setParsingResume(false);
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (resumeText.trim().length < 50 || jobDescription.trim().length < 50) {
      setError("Paste the full resume text and job description (at least a few sentences each).");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, jobDescription, companyName, roleTitle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      sessionStorage.setItem(`questions:${data.applicationId}`, JSON.stringify(data.questions));
      router.push(`/practice/${data.applicationId}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">New practice session</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Paste your resume text and the job description. Questions are generated
        from the specific overlap and gaps between them.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground">Company</label>
            <input
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Role</label>
            <input
              className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Full Stack Developer"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-foreground">Resume text</label>
            <label className="cursor-pointer text-xs font-medium text-primary hover:opacity-80">
              {parsingResume ? "Reading PDF..." : "Upload PDF instead"}
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleResumeFile}
                disabled={parsingResume}
              />
            </label>
          </div>
          <textarea
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
            rows={8}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume text here..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground">Job description</label>
          <textarea
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground"
            rows={8}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? "Generating questions..." : "Generate interview questions"}
        </button>
      </form>
    </div>
  );
}
```

All handlers (`handleResumeFile`, `handleSubmit`) are byte-for-byte the same logic as before — only the JSX class names changed (slate-* hardcoded colors → shadcn tokens, card wrapper added around the form). This is deliberately light on animation per the spec — it's a data-entry flow.

- [ ] **Step 2: Build to verify**

Run: `npm run build`
Expected: compiles clean, 0 errors.

- [ ] **Step 3: Manual check**

Run `npm run dev`, sign in, go to `/setup`. Confirm the PDF upload still works (upload a real resume PDF, confirm text fills the textarea) and form submission still generates questions — this task must not have changed any of that behavior, only its appearance.

- [ ] **Step 4: Commit**

```bash
git add src/app/setup/page.tsx
git commit -m "style: restyle setup page with theme tokens and card layout"
```

---

### Task 9: Redesign the practice page

**Files:**
- Modify: `src/app/practice/[applicationId]/page.tsx` (full replacement)

- [ ] **Step 1: Replace `src/app/practice/[applicationId]/page.tsx` in full**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { AnimatedCounter } from "@/components/animated-counter";

interface Question {
  id: string;
  question_text: string;
  category: string;
  relevance_reason: string;
  order_rank: number;
}

interface ScoreResult {
  score: number;
  feedback: string;
  weak_areas: string[];
}

export default function PracticePage() {
  const { applicationId } = useParams<{ applicationId: string }>();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [scoring, setScoring] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cached = sessionStorage.getItem(`questions:${applicationId}`);
    if (cached) {
      setQuestions(JSON.parse(cached));
    }
    setLoading(false);
  }, [applicationId]);

  async function handleSubmitAnswer() {
    if (!answer.trim()) return;
    setScoring(true);
    setResult(null);

    const question = questions[activeIndex];
    try {
      const res = await fetch("/api/attempts/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: question.id,
          questionText: question.question_text,
          userAnswer: answer,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult({ score: data.score, feedback: data.feedback, weak_areas: data.weak_areas });
    } catch (err) {
      setResult({
        score: 0,
        feedback: `Scoring failed: ${(err as Error).message}`,
        weak_areas: [],
      });
    } finally {
      setScoring(false);
    }
  }

  function nextQuestion() {
    setActiveIndex((i) => Math.min(i + 1, questions.length - 1));
    setAnswer("");
    setResult(null);
  }

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;

  if (questions.length === 0) {
    return (
      <div className="p-10 text-center text-muted-foreground">
        No questions found for this session. Start a new one from{" "}
        <a href="/setup" className="text-foreground underline">Setup</a>.
      </div>
    );
  }

  const q = questions[activeIndex];

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Question {activeIndex + 1} of {questions.length}</span>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs uppercase tracking-wide">
          {q.category}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <h2 className="text-lg font-medium text-foreground">{q.question_text}</h2>
          <p className="mt-1 text-sm text-muted-foreground italic">{q.relevance_reason}</p>
        </motion.div>
      </AnimatePresence>

      <textarea
        className="mt-4 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground"
        rows={6}
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Type your answer..."
      />

      <div className="mt-3 flex gap-3">
        <button
          onClick={handleSubmitAnswer}
          disabled={scoring || !answer.trim()}
          className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {scoring ? "Scoring..." : "Submit answer"}
        </button>
        {activeIndex < questions.length - 1 && (
          <button
            onClick={nextQuestion}
            className="rounded-full border border-border px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
          >
            Skip / Next question
          </button>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="mt-6 rounded-2xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl font-semibold text-foreground">
                <AnimatedCounter value={result.score} />
              </span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
            <p className="mt-2 text-sm text-foreground">{result.feedback}</p>
            {result.weak_areas.length > 0 && (
              <ul className="mt-3 list-disc pl-5 text-sm text-muted-foreground">
                {result.weak_areas.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

All fetch/scoring logic is unchanged — only the score display now uses `AnimatedCounter`, and question changes now animate via `AnimatePresence`.

- [ ] **Step 2: Build to verify**

Run: `npm run build`
Expected: compiles clean, 0 errors.

- [ ] **Step 3: Manual check**

Run `npm run dev`, go through a real practice session. Confirm: switching questions slides/fades smoothly, submitting an answer still scores correctly via the real Gemini integration, and the score number counts up from 0 rather than appearing instantly.

- [ ] **Step 4: Commit**

```bash
git add "src/app/practice/[applicationId]/page.tsx"
git commit -m "feat: add question transitions and animated score count-up to practice page"
```

---

### Task 10: Redesign the dashboard page

**Files:**
- Modify: `src/app/dashboard/page.tsx` (full replacement)

- [ ] **Step 1: Replace `src/app/dashboard/page.tsx` in full**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/scroll-reveal";

interface Attempt {
  score: number;
  weak_areas: string[];
}

interface QuestionWithAttempts {
  id: string;
  category: string;
  attempts: Attempt[];
}

interface Application {
  id: string;
  company_name: string | null;
  role_title: string | null;
  created_at: string;
  questions: QuestionWithAttempts[];
}

function averageScore(app: Application): number | null {
  const scores = app.questions.flatMap((q) => q.attempts.map((a) => a.score));
  if (scores.length === 0) return null;
  return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
}

function topWeakAreas(app: Application): string[] {
  const counts = new Map<string, number>();
  for (const q of app.questions) {
    for (const a of q.attempts) {
      for (const w of a.weak_areas) {
        counts.set(w, (counts.get(w) ?? 0) + 1);
      }
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([w]) => w);
}

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/applications")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setApplications(data.applications ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-10 text-center text-destructive">{error}</div>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Your practice history</h1>
        <Link href="/setup" className="text-sm text-foreground underline underline-offset-4">
          New session
        </Link>
      </div>

      {applications.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          No practice sessions yet. Start one from &quot;New Practice&quot; above.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {applications.map((app, i) => {
            const avg = averageScore(app);
            const weakAreas = topWeakAreas(app);
            return (
              <ScrollReveal key={app.id} delay={i * 0.05}>
                <div className="rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-card-foreground">
                        {app.role_title ?? "Untitled role"}
                        {app.company_name ? ` — ${app.company_name}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(app.created_at).toLocaleDateString()} ·{" "}
                        {app.questions.length} questions
                      </p>
                    </div>
                    {avg !== null && (
                      <span className="text-lg font-semibold text-foreground">{avg}/100</span>
                    )}
                  </div>
                  {weakAreas.length > 0 && (
                    <div className="mt-2 flex gap-2">
                      {weakAreas.map((w) => (
                        <span
                          key={w}
                          className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs text-amber-600 dark:text-amber-400"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

`averageScore`/`topWeakAreas`/the `fetch("/api/applications")` call are unchanged — only presentation.

- [ ] **Step 2: Build to verify**

Run: `npm run build`
Expected: compiles clean, 0 errors, all 7 routes still registered (`/`, `/_not-found`, `/api/applications`, `/api/attempts/score`, `/api/resume/parse`, `/dashboard`, `/practice/[applicationId]`, `/setup`).

- [ ] **Step 3: Manual check**

Run `npm run dev`, go to `/dashboard` with at least one completed practice session. Confirm cards fade/slide in on load and lift slightly on hover.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add hover elevation and scroll-reveal to dashboard cards"
```

---

### Task 11: Full walkthrough verification

**Files:** none (verification only)

- [ ] **Step 1: Clean build**

Run: `npm run build`
Expected: 0 errors, all 7 routes registered.

- [ ] **Step 2: Full manual walkthrough in light mode**

Run `npm run dev`. With the theme toggler set to light: visit `/`, sign in, visit `/setup`, paste or upload a real resume + JD, submit, confirm questions generate, answer one on `/practice/[id]`, confirm scoring works, visit `/dashboard`, confirm the session shows with a score.

- [ ] **Step 3: Repeat in dark mode**

Toggle to dark via the nav button, refresh, repeat the same walkthrough. Confirm every screen has correct contrast (no dark text on dark background, no invisible borders) and the theme persists across page navigations and a full refresh.

- [ ] **Step 4: Keyboard/accessibility check with Lenis active**

On any page, click into the address bar then press `Tab` repeatedly to move focus through the nav links, theme toggle, and form fields. Expected: focus moves normally and the page scrolls to keep the focused element in view — Lenis is supposed to preserve native scroll behavior, this confirms it actually does in this app rather than just in Lenis's own docs.

- [ ] **Step 5: Report results to the user**

Summarize what was verified working in both themes and flag anything that looked off (contrast issues, animation jank, anything that didn't match the spec) rather than silently fixing it — the user should decide if a follow-up pass is needed.
