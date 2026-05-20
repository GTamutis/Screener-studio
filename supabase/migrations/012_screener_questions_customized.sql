-- Track screener-local edits (library template unchanged)

alter table screener_questions
  add column if not exists is_customized boolean not null default false;
