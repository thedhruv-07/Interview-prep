-- Run this in the Supabase SQL editor to set up the schema.
-- Row Level Security policies at the bottom scope every table to the owning user.

create extension if not exists "pgcrypto";

create table users (
    id uuid primary key default gen_random_uuid(),
    clerk_id varchar(255) unique not null,
    email varchar(255),
    created_at timestamp default now()
);

create table applications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references users(id) on delete cascade,
    company_name varchar(255),
    role_title varchar(255),
    job_description text not null,
    resume_text text not null,
    created_at timestamp default now()
);

create table questions (
    id uuid primary key default gen_random_uuid(),
    application_id uuid references applications(id) on delete cascade,
    question_text text not null,
    category varchar(50),          -- 'technical' | 'behavioral' | 'system_design'
    relevance_reason text,          -- why the AI picked this question
    order_rank int
);

create table attempts (
    id uuid primary key default gen_random_uuid(),
    question_id uuid references questions(id) on delete cascade,
    user_answer text not null,
    ai_feedback text,
    score int check (score >= 0 and score <= 100),
    weak_areas text[],
    attempted_at timestamp default now()
);

create index idx_applications_user on applications(user_id);
create index idx_questions_application on questions(application_id);
create index idx_attempts_question on attempts(question_id);

-- Row Level Security: every row is scoped to the user who created it.
-- Assumes the app sets the Postgres session's request.jwt.claims via the
-- Supabase client using the Clerk-issued JWT (see src/lib/supabase.ts).

alter table users enable row level security;
alter table applications enable row level security;
alter table questions enable row level security;
alter table attempts enable row level security;

create policy "Users manage their own row"
  on users for all
  using (clerk_id = auth.jwt() ->> 'sub');

create policy "Users manage their own applications"
  on applications for all
  using (user_id in (select id from users where clerk_id = auth.jwt() ->> 'sub'));

create policy "Users manage questions on their own applications"
  on questions for all
  using (application_id in (
    select a.id from applications a
    join users u on u.id = a.user_id
    where u.clerk_id = auth.jwt() ->> 'sub'
  ));

create policy "Users manage attempts on their own questions"
  on attempts for all
  using (question_id in (
    select q.id from questions q
    join applications a on a.id = q.application_id
    join users u on u.id = a.user_id
    where u.clerk_id = auth.jwt() ->> 'sub'
  ));
