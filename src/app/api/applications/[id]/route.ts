import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase";

// Full detail for one application — question text, relevance reasoning, the
// candidate's actual answer, and full feedback per attempt. The dashboard's
// list route deliberately only pulls score + weak_areas (cheap for an
// N-application list); this route is for the "click a session to see
// everything" detail view, so it can afford the fuller select.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const token = await getToken({ template: "supabase" });
  const supabase = createServerSupabaseClient(token);

  // No manual ownership check needed beyond the .eq below — RLS on
  // applications/questions/attempts already scopes every row to the
  // signed-in user's own data (see supabase/schema.sql), so a mismatched id
  // just comes back as zero rows, not another user's data.
  const { data: application, error } = await supabase
    .from("applications")
    .select(
      `id, company_name, role_title, created_at, resume_text, job_description,
       questions ( id, question_text, category, relevance_reason, order_rank,
         attempts ( id, user_answer, ai_feedback, score, weak_areas, attempted_at ) )`
    )
    .eq("id", id)
    .single();

  if (error || !application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  return NextResponse.json({ application });
}
