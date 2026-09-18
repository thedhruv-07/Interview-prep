import Link from "next/link";
import { Show, SignUpButton } from "@clerk/nextjs";
import { MagneticButton } from "@/components/magnetic-button";
import { ScrollReveal } from "@/components/scroll-reveal";
import { PhotoCarousel } from "@/components/photo-carousel";
import { Button, buttonVariants } from "@/components/ui/button";

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

const STEPS = [
  {
    title: "Paste resume + job description",
    body: "Type it in, or upload a resume PDF directly on the setup page.",
  },
  {
    title: "Get gap-anchored questions",
    body: "Ten questions generated from the specific overlap and gaps between the two documents.",
  },
  {
    title: "Practice, get scored, improve",
    body: "Answer each one, get concrete feedback, and watch weak areas surface on your dashboard.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="relative overflow-hidden">
        {/* Photo carousel as the full section background, with its own dark
            scrim (see PhotoCarousel's fill mode) so text stays legible over
            any of the 4 photos. Gradient-clipped text would camouflage into
            a busy photo, so this section switches to solid white text
            instead of .text-gradient-brand while the photo is behind it. */}
        <PhotoCarousel fill />
        <div className="relative mx-auto max-w-3xl px-6 py-28 text-center">
          {/* ScrollReveal's whileInView fires immediately for anything
              already in the viewport on load — the hero qualifies, so this
              doubles as an entrance animation without a separate component. */}
          <ScrollReveal>
            <span className="inline-flex items-center rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              Gap-anchored questions · Real scoring
            </span>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <h1 className="mt-5 text-4xl sm:text-5xl font-bold tracking-tight text-white drop-shadow-lg">
              Practice for the interview you actually have.
            </h1>
          </ScrollReveal>
          <ScrollReveal delay={0.2}>
            <p className="mt-4 text-lg text-white/85 drop-shadow-md">
              Paste your resume and a job description. Get interview questions built
              from the specific gaps and overlaps between them — then practice and
              get scored, not just a generic question bank.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.3}>
            <div className="mt-10 flex justify-center">
              <Show when="signed-out">
                <SignUpButton>
                  <MagneticButton>Get started</MagneticButton>
                </SignUpButton>
              </Show>
              <Show when="signed-in">
                <Link href="/setup" className={buttonVariants({ variant: "primary", size: "lg" })}>
                  Start a new practice session
                </Link>
              </Show>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-8 sm:grid-cols-3">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 0.1}>
              <div className="rounded-2xl border border-border bg-card p-6 h-full">
                <h2 className="font-semibold text-card-foreground">{f.title}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="border-t border-border/50 bg-muted/30 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal>
            <h2 className="text-center text-2xl font-bold tracking-tight text-foreground">
              How it works
            </h2>
          </ScrollReveal>
          <div className="mt-12 grid gap-10 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <ScrollReveal key={step.title} delay={i * 0.1}>
                <div className="text-center sm:text-left">
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-gradient-brand text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mt-2 font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-brand px-6 py-20 text-center">
        <ScrollReveal>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Stop guessing what they&apos;ll ask.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Free to start — paste a resume and a job description and see your first
            set of questions in under a minute.
          </p>
          <div className="mt-8 flex justify-center">
            <Show when="signed-out">
              <SignUpButton>
                <Button variant="inverse" size="lg">Get started free</Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/setup" className={buttonVariants({ variant: "inverse", size: "lg" })}>
                Start a new practice session
              </Link>
            </Show>
          </div>
        </ScrollReveal>
      </section>

      <footer className="border-t border-border/50 px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-gradient-brand font-semibold">Interview Prep Copilot</p>
            <p className="text-sm text-muted-foreground">
              JD-specific interview practice, generated from your resume.
            </p>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Show when="signed-out">
              <SignUpButton>
                <Button variant="primary" size="sm">Sign up</Button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <Link href="/setup" className="hover:text-foreground transition-colors">
                New practice
              </Link>
              <Link href="/dashboard" className="hover:text-foreground transition-colors">
                Dashboard
              </Link>
            </Show>
          </nav>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Interview Prep Copilot.
        </p>
      </footer>
    </div>
  );
}
