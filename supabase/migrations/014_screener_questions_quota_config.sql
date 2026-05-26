-- Per-question quota targets (screener copy only)

alter table screener_questions
  add column if not exists quota_config jsonb;
