"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { AnimatedCounter } from "@/components/animated-counter";
import { FeedbackChat } from "@/components/feedback-chat";
import { formatWeakArea } from "@/lib/format-weak-area";
import { Button } from "@/components/ui/button";

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
  // Snapshot of whatever was actually submitted/scored — the textarea below
  // stays editable after scoring, so FeedbackChat can't just read the live
  // `answer` state (editing or clearing the box would silently change what
  // the chat request sends, and an emptied box would fail its own
  // validation on the server with a confusing 400).
  const [submittedAnswer, setSubmittedAnswer] = useState("");
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [scoring, setScoring] = useState(false);
  const [loading, setLoading] = useState(true);

  // NOTE: fetching the question list client-side via a GET route is the
  // straightforward next addition — for this scope, questions are passed
  // through from the setup response and cached in sessionStorage so the
  // practice page works on refresh without a second round trip.
  useEffect(() => {
    const cached = sessionStorage.getItem(`questions:${applicationId}`);
    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage only exists client-side, so reading it on mount requires an effect, not a lazy useState initializer
      setQuestions(JSON.parse(cached));
    }
    setLoading(false);
  }, [applicationId]);

  async function handleSubmitAnswer() {
    if (!answer.trim()) return;
    setScoring(true);
    setResult(null);
    setSubmittedAnswer(answer);

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
    setSubmittedAnswer("");
    setResult(null);
  }

  function prevQuestion() {
    setActiveIndex((i) => Math.max(i - 1, 0));
    setAnswer("");
    setSubmittedAnswer("");
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

  // Narrow single column while just answering; widens into a two-column
  // layout once there's a score to discuss, so the chat sits beside the
  // question instead of stacking below it.
  return (
    <div className={result ? "mx-auto max-w-5xl px-6 py-10" : "mx-auto max-w-2xl px-6 py-10"}>
      <div className={result ? "grid gap-6 lg:grid-cols-[1fr_380px]" : ""}>
        <div>
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
            {activeIndex > 0 && (
              <Button variant="outline" onClick={prevQuestion}>
                Previous question
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleSubmitAnswer}
              disabled={scoring || !answer.trim()}
            >
              {scoring ? "Scoring..." : "Submit answer"}
            </Button>
            {activeIndex < questions.length - 1 && (
              <Button
                variant="outline"
                onClick={nextQuestion}
                disabled={!result}
                title={result ? undefined : "Submit an answer to unlock the next question"}
              >
                Next question
              </Button>
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
                      <li key={i}>{formatWeakArea(w)}</li>
                    ))}
                  </ul>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Keyed on activeIndex so moving to the next question starts a fresh
            chat rather than carrying the previous question's thread over.
            Sticky so it stays in view while the left column scrolls. */}
        {result && (
          <div className="lg:sticky lg:top-20 lg:self-start">
            <FeedbackChat
              key={activeIndex}
              questionText={q.question_text}
              userAnswer={submittedAnswer}
              feedback={result.feedback}
            />
          </div>
        )}
      </div>
    </div>
  );
}
