do $$
begin
  create type workspace_feedback_kind as enum ('bug', 'suggestion');
exception
  when duplicate_object then null;
end $$;

create table if not exists workspace_feedback (
  id uuid primary key default gen_random_uuid(),
  kind workspace_feedback_kind not null,
  message text not null,
  page_url text,
  clerk_user_id text not null,
  user_email text not null,
  user_display_name text,
  created_at timestamptz not null default now()
);

create index if not exists workspace_feedback_created_at_idx
  on workspace_feedback (created_at desc);

create index if not exists workspace_feedback_kind_created_at_idx
  on workspace_feedback (kind, created_at desc);
