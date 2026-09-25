"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { fetchJson } from "@/lib/fetch-json";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function FeedbackChat({
  questionText,
  userAnswer,
  feedback,
}: {
  questionText: string;
  userAnswer: string;
  feedback: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    if (!input.trim() || loading) return;
    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const data = await fetchJson<{ reply: string }>("/api/attempts/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionText, userAnswer, feedback, messages: nextMessages }),
      });
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-medium text-foreground">Discuss this feedback</p>

      {messages.length > 0 && (
        <div className="mt-3 max-h-64 space-y-3 overflow-y-auto">
          <AnimatePresence initial={false}>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={m.role === "user" ? "text-right" : "text-left"}
              >
                <span
                  className={
                    "inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm " +
                    (m.role === "user"
                      ? "bg-gradient-brand text-white"
                      : "bg-muted text-foreground")
                  }
                >
                  {m.content}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && <p className="text-sm text-muted-foreground">Thinking...</p>}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}

      <div className="mt-3 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask about this feedback..."
          disabled={loading}
        />
        <Button variant="primary" onClick={handleSend} disabled={loading || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
