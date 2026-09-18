import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { generateQuestions } from "@/lib/ai";

export async function GET() {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await getToken({ template: "supabase" });
  const supabase = createServerSupabaseClient(token);

  const { data: userRow } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", userId)
    .single();

  if (!userRow) {
    return NextResponse.json({ applications: [] });
  }

  // Pull applications with their questions + attempts nested, so the
  // dashboard can compute per-application average score and weak-area
  // trends without N+1 round trips.
  const { data: applications, error } = await supabase
    .from("applications")
    .select(
      `id, company_name, role_title, created_at,
       questions ( id, category, attempts ( score, weak_areas ) )`
    )
    .eq("user_id", userRow.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ applications });
}

export async function POST(req: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { resumeText, jobDescription, companyName, roleTitle } = await req.json();

  if (!resumeText || !jobDescription) {
    return NextResponse.json(
      { error: "resumeText and jobDescription are required" },
      { status: 400 }
    );
  }

  const token = await getToken({ template: "supabase" });
  const supabase = createServerSupabaseClient(token);

  // Ensure a users row exists for this Clerk user (first-time login upsert)
  const { data: userRow, error: userErr } = await supabase
    .from("users")
    .upsert({ clerk_id: userId }, { onConflict: "clerk_id" })
    .select("id")
    .single();

  if (userErr || !userRow) {
    return NextResponse.json({ error: userErr?.message ?? "User upsert failed" }, { status: 500 });
  }

  const { data: application, error: appErr } = await supabase
    .from("applications")
    .insert({
      user_id: userRow.id,
      company_name: companyName ?? null,
      role_title: roleTitle ?? null,
      job_description: jobDescription,
      resume_text: resumeText,
    })
    .select("id")
    .single();

  if (appErr || !application) {
    return NextResponse.json({ error: appErr?.message ?? "Application insert failed" }, { status: 500 });
  }

  let generated;
  try {
    generated = await generateQuestions(resumeText, jobDescription);
  } catch (e) {
    return NextResponse.json(
      { error: `Question generation failed: ${(e as Error).message}` },
      { status: 502 }
    );
  }

  const rows = generated.map((q, i) => ({
    application_id: application.id,
    question_text: q.question,
    category: q.category,
    relevance_reason: q.relevance_reason,
    order_rank: i,
  }));

  const { data: questions, error: qErr } = await supabase
    .from("questions")
    .insert(rows)
    .select("*");

  if (qErr) {
    return NextResponse.json({ error: qErr.message }, { status: 500 });
  }

  return NextResponse.json({ applicationId: application.id, questions });
}
