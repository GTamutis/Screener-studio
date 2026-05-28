-- Screener versioning: major/minor columns and draft | final status.

alter table screeners
  add column if not exists major_version integer not null default 1,
  add column if not exists minor_version integer not null default 1;

alter table screeners
  alter column status drop default;

alter table screeners
  alter column status type text
  using (
    case
      when (status::text) in ('published', 'archived') then 'final'
      when (status::text) = 'in_progress' then 'draft'
      when (status::text) = 'final' then 'final'
      else 'draft'
    end
  );

update screeners
set minor_version = 0
where status = 'final';

drop type if exists screener_status;

create type screener_status as enum ('draft', 'final');

alter table screeners
  alter column status drop default;

alter table screeners
  alter column status type screener_status
  using (
    (
      case
        when status = 'final' then 'final'
        else 'draft'
      end
    )::screener_status
  );

alter table screeners
  alter column status set default 'draft'::screener_status;

alter table screeners
  alter column status set not null;
