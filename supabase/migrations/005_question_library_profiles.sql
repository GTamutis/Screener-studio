-- Question library and admin profiles (Clerk user IDs)

create table profiles (
  id text primary key,
  is_admin boolean not null default false,
  name text,
  created_at timestamptz not null default now()
);

create table question_library (
  id uuid primary key default gen_random_uuid(),
  display_id text,
  question_text text not null,
  question_type text not null check (
    question_type in (
      'single',
      'multi',
      'open',
      'numeric',
      'scale',
      'statement',
      'grid'
    )
  ),
  answer_options jsonb,
  category text not null check (
    category in (
      'introduction',
      'disclaimer',
      'consent',
      'exclusion',
      'demographics',
      'hcp_qualification',
      'scheduling',
      'screening',
      'other'
    )
  ),
  tags text[],
  sector text[],
  methodology text[],
  language text not null default 'en',
  notes text,
  is_locked boolean not null default true,
  status text not null default 'draft' check (
    status in ('draft', 'approved', 'archived')
  ),
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index question_library_display_id_idx
  on question_library (display_id)
  where display_id is not null;

create index question_library_status_idx on question_library (status);
create index question_library_category_idx on question_library (category);

-- Keep updated_at current on row changes
create or replace function set_question_library_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger question_library_updated_at
  before update on question_library
  for each row
  execute function set_question_library_updated_at();

-- Resolve Clerk user id from JWT (Supabase third-party auth)
create or replace function public.current_clerk_user_id()
returns text
language sql
stable
as $$
  select nullif(auth.jwt() ->> 'sub', '');
$$;

create or replace function public.is_library_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from profiles
    where id = public.current_clerk_user_id()
      and is_admin = true
  );
$$;

-- Row Level Security

alter table profiles enable row level security;
alter table question_library enable row level security;

-- Profiles: users can read their own row (needed for client-side admin checks)
create policy profiles_select_own
  on profiles
  for select
  to authenticated
  using (id = public.current_clerk_user_id());

-- Question library: all authenticated users read approved questions
create policy question_library_select_approved
  on question_library
  for select
  to authenticated
  using (status = 'approved');

-- Admins can read all statuses (draft/archived management)
create policy question_library_select_admin
  on question_library
  for select
  to authenticated
  using (public.is_library_admin());

create policy question_library_insert_admin
  on question_library
  for insert
  to authenticated
  with check (public.is_library_admin());

create policy question_library_update_admin
  on question_library
  for update
  to authenticated
  using (public.is_library_admin())
  with check (public.is_library_admin());

create policy question_library_delete_admin
  on question_library
  for delete
  to authenticated
  using (public.is_library_admin());
