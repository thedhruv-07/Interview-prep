import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { discussFeedback, type ChatMessage } from "@/lib/ai";

// Ephemeral, per-question follow-up chat about a scored answer — no DB
// write. The whole conversation (question/answer/feedback + message history)
// round-trips from the client each call, same pattern as the practice page
// already uses for questions via sessionStorage rather than a server fetch.
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { questionText, userAnswer, feedback, messages } = await req.json();

  if (
    !questionText ||
    !userAnswer ||
    !feedback ||
    !Array.isArray(messages) ||
    messages.length === 0
  ) {
    return NextResponse.json(
      { error: "questionText, userAnswer, feedback, and a non-empty messages array are required" },
      { status: 400 }
    );
  }

  try {
    const reply = await discussFeedback(
      questionText,
      userAnswer,
      feedback,
      messages as ChatMessage[]
    );
    return NextResponse.json({ reply });
  } catch (e) {
    return NextResponse.json(
      { error: `Chat failed: ${(e as Error).message}` },
      { status: 502 }
    );
  }
}
