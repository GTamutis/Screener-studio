-- Invitely: run in Supabase SQL editor or via CLI migrations.

create table if not exists invite_sessions (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  client_name text not null,
  project_name text not null,
  countries text[] not null default '{}',
  password_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists invite_sessions_clerk_created_idx
  on invite_sessions (clerk_user_id, created_at desc);

create table if not exists invite_attendees (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references invite_sessions(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  invite_all boolean not null default false,
  selected_countries text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invite_attendees_session_idx on invite_attendees(session_id);

create table if not exists invite_changelog (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references invite_sessions(id) on delete cascade,
  actor_name text not null,
  action text not null check (action in ('add', 'update', 'delete')),
  attendee_id uuid references invite_attendees(id) on delete set null,
  attendee_label text not null,
  invite_all boolean,
  selected_countries text[],
  created_at timestamptz not null default now()
);

create index if not exists invite_changelog_session_created_idx
  on invite_changelog (session_id, created_at desc);
