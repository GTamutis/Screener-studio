create table app_users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique,
  email text not null,
  display_name text,
  role text not null check (role in ('admin', 'member')),
  status text not null check (status in ('pending', 'active', 'disabled')),
  invited_by_clerk_id text,
  approved_at timestamptz,
  approved_by_clerk_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index app_users_email_lower_idx on app_users (lower(email));
create index app_users_status_idx on app_users (status);
create index app_users_clerk_user_id_idx on app_users (clerk_user_id) where clerk_user_id is not null;
