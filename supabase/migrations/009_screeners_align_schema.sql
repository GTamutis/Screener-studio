-- Run this if 008_screeners.sql failed with "relation screeners already exists".
-- Safe to run multiple times.

do $$
begin
  create type screener_status as enum (
    'draft',
    'in_progress',
    'published',
    'archived'
  );
exception
  when duplicate_object then null;
end $$;

alter table screeners
  add column if not exists project_id uuid references projects (id) on delete cascade,
  add column if not exists created_by uuid references app_users (id),
  add column if not exists name text,
  add column if not exists status screener_status not null default 'draft',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

create index if not exists screeners_project_id_created_at_idx
  on screeners (project_id, created_at desc);
