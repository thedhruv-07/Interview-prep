"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ScrollReveal } from "@/components/scroll-reveal";
import { ScoreMeter } from "@/components/score-meter";
import { formatWeakArea } from "@/lib/format-weak-area";
import { fetchJson } from "@/lib/fetch-json";

interface Attempt {
  id: string;
  user_answer: string;
  ai_feedback: string | null;
  score: number | null;
  weak_areas: string[];
  attempted_at: string;
}

interface QuestionDetail {
  id: string;
  question_text: string;
  category: string;
  relevance_reason: string;
  order_rank: number;
  attempts: Attempt[];
}

interface ApplicationDetail {
  id: string;
  company_name: string | null;
  role_title: string | null;
  created_at: string;
  questions: QuestionDetail[];
}

export default function SessionDetailPage() {
  const { applicationId } = useParams<{ applicationId: string }>();

  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJson<{ application: ApplicationDetail }>(`/api/applications/${applicationId}`)
      .then((data) => setApplication(data.application))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [applicationId]);

  if (loading) return <div className="p-10 text-center text-muted-foreground">Loading...</div>;
  if (error) return <div className="p-10 text-center text-destructive">{error}</div>;
  if (!application) return null;

  const questions = [...application.questions].sort((a, b) => a.order_rank - b.order_rank);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        ← Back to dashboard
      </Link>

      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
        {application.role_title ?? "Untitled role"}
        {application.company_name ? ` — ${application.company_name}` : ""}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {new Date(application.created_at).toLocaleDateString()} · {questions.length} questions
      </p>

      <div className="mt-8 space-y-6">
        {questions.map((q, i) => {
          const attempt = q.attempts[0];
          return (
            <ScrollReveal key={q.id} delay={i * 0.03}>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Question {i + 1}</span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 uppercase tracking-wide">
                    {q.category}
                  </span>
                </div>
                <h2 className="mt-2 font-medium text-card-foreground">{q.question_text}</h2>
                <p className="mt-1 text-sm text-muted-foreground italic">{q.relevance_reason}</p>

                {attempt ? (
                  <div className="mt-4 border-t border-border pt-4">
                    <p className="text-xs font-medium text-muted-foreground">Your answer</p>
                    <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{attempt.user_answer}</p>

                    {attempt.score !== null && (
                      <div className="mt-3">
                        <ScoreMeter value={attempt.score} />
                      </div>
                    )}

                    {attempt.ai_feedback && (
                      <p className="mt-3 text-sm text-foreground">{attempt.ai_feedback}</p>
                    )}

                    {attempt.weak_areas.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {attempt.weak_areas.map((w, j) => (
                          <span
                            key={j}
                            title={formatWeakArea(w)}
                            className="max-w-50 truncate rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-foreground"
                          >
                            {formatWeakArea(w)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
                    Not answered in this session.
                  </p>
                )}
              </div>
            </ScrollReveal>
          );
        })}
      </div>
    </div>
  );
}
