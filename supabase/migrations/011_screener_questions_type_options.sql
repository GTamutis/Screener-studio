-- Question type and answer options for screener questions (manual / future edit)

alter table screener_questions
  add column if not exists question_type text check (
    question_type is null
    or question_type in (
      'single',
      'multi',
      'open',
      'numeric',
      'scale',
      'statement',
      'grid'
    )
  ),
  add column if not exists answer_options jsonb;
