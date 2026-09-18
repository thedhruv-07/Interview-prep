import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { scoreAnswer } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { questionId, questionText, userAnswer } = await req.json();

  if (!questionId || !questionText || !userAnswer) {
    return NextResponse.json(
      { error: "questionId, questionText, and userAnswer are required" },
      { status: 400 }
    );
  }

  let result;
  try {
    result = await scoreAnswer(questionText, userAnswer);
  } catch (e) {
    return NextResponse.json(
      { error: `Scoring failed: ${(e as Error).message}` },
      { status: 502 }
    );
  }

  const token = await getToken({ template: "supabase" });
  const supabase = createServerSupabaseClient(token);

  const { data: attempt, error } = await supabase
    .from("attempts")
    .insert({
      question_id: questionId,
      user_answer: userAnswer,
      ai_feedback: result.feedback,
      score: result.score,
      weak_areas: result.weak_areas,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ attempt, ...result });
}
