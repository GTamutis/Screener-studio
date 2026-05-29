-- Nested sub-questions: one level of parent/child hierarchy.
alter table screener_questions
  add column if not exists parent_id uuid references screener_questions(id) on delete cascade,
  add column if not exists sub_position integer;

-- Top-level position uniqueness only (sub-questions share parent position).
drop index if exists screener_questions_screener_id_position_key;
create unique index if not exists screener_questions_screener_id_position_top_level_key
  on screener_questions (screener_id, position)
  where parent_id is null;

create index if not exists screener_questions_parent_id_idx
  on screener_questions (parent_id)
  where parent_id is not null;
