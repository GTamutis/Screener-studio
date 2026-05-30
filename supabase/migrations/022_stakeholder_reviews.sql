-- Stakeholder panel reviews (AI) + screener review run status

-- ---------------------------------------------------------------------------
-- stakeholder_reviews
-- ---------------------------------------------------------------------------

create table if not exists stakeholder_reviews (
  id uuid primary key default gen_random_uuid(),
  screener_id uuid not null references screeners (id) on delete cascade,
  persona text not null check (
    persona in (
      'market_research_lead',
      'marketing_lead',
      'legal_regulatory',
      'medical'
    )
  ),
  question_id uuid references screener_questions (id) on delete cascade,
  severity text not null check (
    severity in ('green', 'amber', 'red')
  ),
  feedback_text text not null,
  user_decision text check (
    user_decision is null
    or user_decision in ('implemented', 'dismissed')
  ),
  user_decision_note text,
  created_at timestamptz not null default now()
);

create index if not exists stakeholder_reviews_screener_id_created_at_idx
  on stakeholder_reviews (screener_id, created_at desc);

create index if not exists stakeholder_reviews_screener_id_question_id_idx
  on stakeholder_reviews (screener_id, question_id)
  where question_id is not null;

comment on table stakeholder_reviews is
  'AI stakeholder panel feedback per screener (optionally per question).';

comment on column stakeholder_reviews.question_id is
  'Null = feedback applies to the screener overall, not a specific question.';

-- ---------------------------------------------------------------------------
-- Row Level Security (project owner via projects.clerk_user_id)
-- ---------------------------------------------------------------------------

alter table stakeholder_reviews enable row level security;

drop policy if exists stakeholder_reviews_project_owner on stakeholder_reviews;

create policy stakeholder_reviews_project_owner
  on stakeholder_reviews
  for all
  to authenticated
  using (
    exists (
      select 1
        from screeners s
        join projects p on p.id = s.project_id
       where s.id = stakeholder_reviews.screener_id
         and p.clerk_user_id = public.current_clerk_user_id()
    )
  )
  with check (
    exists (
      select 1
        from screeners s
        join projects p on p.id = s.project_id
       where s.id = stakeholder_reviews.screener_id
         and p.clerk_user_id = public.current_clerk_user_id()
    )
  );

-- ---------------------------------------------------------------------------
-- screeners.stakeholder_review_status
-- ---------------------------------------------------------------------------

alter table screeners
  add column if not exists stakeholder_review_status text
  constraint screeners_stakeholder_review_status_check check (
    stakeholder_review_status is null
    or stakeholder_review_status in ('running', 'complete', 'failed')
  );

comment on column screeners.stakeholder_review_status is
  'Last stakeholder panel run: null = never run; running | complete | failed.';
