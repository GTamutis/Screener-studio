create table fmv_entries (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  client_name text not null,
  country text not null,
  project_target text not null,
  methodology text,
  currency_code text not null,
  hourly_rate_local numeric(18, 6) not null check (hourly_rate_local > 0),
  hourly_rate_usd numeric(18, 6) not null,
  hourly_rate_gbp numeric(18, 6) not null,
  hourly_rate_eur numeric(18, 6) not null,
  fx_rate_date date not null,
  created_at timestamptz not null default now()
);

create index on fmv_entries (clerk_user_id, created_at desc);
create index on fmv_entries (clerk_user_id, lower(country));
create index on fmv_entries (clerk_user_id, currency_code);
