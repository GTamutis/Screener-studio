-- Questions belonging to a screener (editor canvas)

do $$
begin
  create type screener_question_source as enum (
    'library',
    'manual',
    'ai_draft'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists screener_questions (
  id uuid primary key default gen_random_uuid(),
  screener_id uuid not null references screeners (id) on delete cascade,
  position integer not null,
  question_text text not null,
  source screener_question_source not null default 'manual',
  is_locked boolean not null default false,
  library_question_id uuid references question_library (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint screener_questions_position_positive check (position > 0),
  unique (screener_id, position)
);

create index if not exists screener_questions_screener_id_position_idx
  on screener_questions (screener_id, position);

create or replace function set_screener_questions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists screener_questions_updated_at on screener_questions;

create trigger screener_questions_updated_at
  before update on screener_questions
  for each row
  execute function set_screener_questions_updated_at();
