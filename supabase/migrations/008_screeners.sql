-- Fresh databases: creates screeners from scratch.
-- If you already have a screeners table, run 009_screeners_align_schema.sql instead.

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

create table if not exists screeners (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  created_by uuid not null references app_users (id),
  name text not null,
  status screener_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists screeners_project_id_created_at_idx
  on screeners (project_id, created_at desc);
