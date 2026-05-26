create table outreach_chat_sessions (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  article_id text not null,
  article_title text not null,
  article_link text,
  article_source text,
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index outreach_chat_sessions_user_article_idx
  on outreach_chat_sessions (clerk_user_id, article_id, updated_at desc);

create index outreach_chat_sessions_user_updated_idx
  on outreach_chat_sessions (clerk_user_id, updated_at desc);
