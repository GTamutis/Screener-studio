create table projects (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  client_name text not null,
  project_number text not null,
  project_name text not null,
  markets text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index on projects (clerk_user_id, created_at desc);
