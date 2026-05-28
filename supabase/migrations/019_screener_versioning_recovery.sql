-- Emergency recovery migration: uses a new status column + new enum type.
-- This avoids enum/text comparison errors during ALTER COLUMN TYPE.
-- Run once in Supabase SQL Editor.

alter table screeners
  add column if not exists major_version integer not null default 1,
  add column if not exists minor_version integer not null default 1;

do $$
begin
  create type screener_status_v2 as enum ('draft', 'final');
exception
  when duplicate_object then null;
end $$;

alter table screeners
  add column if not exists status_v2 screener_status_v2;

update screeners
set status_v2 = (
  case
    when status::text in ('published', 'archived', 'final') then 'final'
    else 'draft'
  end
)::screener_status_v2;

update screeners
set minor_version = 0
where status_v2 = 'final'::screener_status_v2;

alter table screeners
  drop column status;

alter table screeners
  rename column status_v2 to status;

alter table screeners
  alter column status set default 'draft'::screener_status_v2,
  alter column status set not null;

drop type if exists screener_status;
alter type screener_status_v2 rename to screener_status;
