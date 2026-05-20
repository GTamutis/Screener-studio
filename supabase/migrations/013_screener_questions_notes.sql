-- Routing notes / criteria copied from library (screener-local copy)

alter table screener_questions
  add column if not exists notes text;
