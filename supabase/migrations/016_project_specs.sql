-- Project-level specs for screener design and AI assistance (per project).
alter table projects
  add column if not exists project_specs jsonb not null default '{}'::jsonb;

comment on column projects.project_specs is
  'Screener design context: objectives, therapy area, background, termination criteria, etc.';
