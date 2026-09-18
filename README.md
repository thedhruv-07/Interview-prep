# Interview Prep Copilot

Paste your resume and a job description → get interview questions generated
from the specific gaps and overlaps between them, not a generic question
bank. Practice by answering, get AI-scored feedback on specificity and
structure, and track weak areas across multiple applications on a dashboard.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind)
- **Clerk** — auth (Core 3 API — uses `<Show when="signed-in">`, not the
  older `<SignedIn>`/`<SignedOut>` components)
- **Supabase (Postgres)** — data, with Row Level Security scoped per user via
  a Clerk JWT template
- **Google Gemini API** (`gemini-2.5-flash`, free tier) — question generation + answer scoring

## Setup

```bash
npm install
cp .env.example .env.local
```

Fill in `.env.local`:

1. **Clerk** — create an app at dashboard.clerk.com, copy the publishable +
   secret keys. Then create a JWT template named `supabase` (Configure → JWT
   Templates) — Supabase's docs have the exact claim shape to use.
2. **Supabase** — create a project, run `supabase/schema.sql` in the SQL
   editor, then wire Clerk as a third-party auth provider (Authentication →
   Sign In / Providers → Clerk) so the RLS policies in that schema resolve
   `auth.jwt() ->> 'sub'` to the Clerk user id.
3. **Google Gemini** — a free API key from aistudio.google.com/apikey (no card required).

```bash
npm run dev
```

## Architecture notes

- **Two prompts do the real work** (`src/lib/ai.ts`): question generation is
  explicitly anchored to gaps/overlaps between the resume and JD (not a
  generic "top 10 questions" prompt), and scoring is anchored to
  specificity/structure with a required concrete-feedback instruction — both
  choices are what separate this from a thin LLM wrapper.
- **RLS via Clerk JWT** — every table's Row Level Security policy resolves
  through `auth.jwt() ->> 'sub'`, so a user can only ever read/write their
  own rows, enforced at the database layer, not just in application code.
- **Dashboard aggregation** happens in one Supabase query with nested
  selects (`applications → questions → attempts`), avoiding N+1 round trips
  for the weak-area trend view.

## Verification status (what's actually been tested here)

- `npm run build` — clean production build, zero errors, all 7 routes
  registered correctly, verified in this environment.
- `npm run start` — server boots and correctly *rejects* a dummy Clerk key at
  runtime with Clerk's own validation error, which confirms the Clerk
  integration is wired correctly — but the full signed-in flow (auth →
  Supabase write → Claude call) has **not** been exercised end-to-end, since
  that needs real Clerk/Supabase/Anthropic credentials this environment
  doesn't have.
- **Before treating this as demo-ready**: run it locally with real keys,
  sign up, paste a real resume + JD, and confirm question generation,
  answer scoring, and the dashboard all round-trip correctly. Fix whatever
  the first real run surfaces — treat that as expected, not a sign
  something's wrong with the scaffold.

## Known gaps / next steps

- Voice input for practice answers (stretch goal from the original scope,
  not built)
- The practice page currently gets its question list from `sessionStorage`
  set by the setup page — fine for the MVP flow, but add a `GET
  /api/applications/[id]` route if you want practice sessions to be
  resumable from a bookmarked/shared link without going through setup first.
- No resume PDF upload yet — setup page takes pasted text only. Add
  `pdf-parse` (already installed) to a new upload endpoint if you want file
  upload instead of copy-paste.
