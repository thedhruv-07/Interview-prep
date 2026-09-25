"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ScrollReveal } from "@/components/scroll-reveal";
import { StatTile } from "@/components/stat-tile";
import { ScoreMeter } from "@/components/score-meter";
import { GradientBackground } from "@/components/animate-ui/components/backgrounds/gradient";
import { formatWeakArea } from "@/lib/format-weak-area";
import { buttonVariants } from "@/components/ui/button";
import { fetchJson } from "@/lib/fetch-json";

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
        const key = formatWeakArea(w);
        counts.set(key, (counts.get(key) ?? 0) + 1);
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
    fetchJson<{ applications?: Application[] }>("/api/applications")
      .then((data) => setApplications(data.applications ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-10 text-center text-destructive">{error}</div>;

  const allScores = applications.flatMap((app) =>
    app.questions.flatMap((q) => q.attempts.map((a) => a.score))
  );
  const overallAvg =
    allScores.length > 0
      ? Math.round(allScores.reduce((sum, s) => sum + s, 0) / allScores.length)
      : null;

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/50">
        <GradientBackground className="absolute inset-0 from-amber-800/40 via-amber-700/22 to-transparent" />
        <div className="relative mx-auto max-w-3xl px-6 py-16">
          <div className="flex items-center justify-between">
            <h1 className="text-gradient-brand text-3xl font-bold tracking-tight">Your practice history</h1>
            <Link href="/setup" className={buttonVariants({ variant: "primary", size: "sm" })}>
              New session
            </Link>
          </div>

          {applications.length > 0 && (
            <div className="mt-8 grid grid-cols-3 gap-4">
              <ScrollReveal delay={0}>
                <StatTile label="Sessions" value={applications.length} />
              </ScrollReveal>
              <ScrollReveal delay={0.1}>
                <StatTile label="Average score" value={overallAvg !== null ? overallAvg : "—"} />
              </ScrollReveal>
              <ScrollReveal delay={0.2}>
                <StatTile label="Questions answered" value={allScores.length} />
              </ScrollReveal>
            </div>
          )}
        </div>
      </section>

      {applications.length === 0 ? (
        <p className="mx-auto max-w-3xl px-6 py-10 text-muted-foreground">
          No practice sessions yet. Start one from &quot;New Practice&quot; above.
        </p>
      ) : (
        <div className="mx-auto max-w-3xl px-6 py-10">
          <h2 className="text-sm font-medium text-muted-foreground">Recent sessions</h2>
          <div className="mt-3 space-y-4">
          {applications.map((app, i) => {
            const avg = averageScore(app);
            const weakAreas = topWeakAreas(app);
            return (
              <ScrollReveal key={app.id} delay={i * 0.05}>
                <Link
                  href={`/dashboard/${app.id}`}
                  className="block rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5"
                >
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
                    {avg !== null && <ScoreMeter value={avg} />}
                  </div>
                  {weakAreas.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {weakAreas.map((w) => (
                        <span
                          key={w}
                          title={w}
                          className="max-w-50 truncate rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-foreground"
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </ScrollReveal>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
}
