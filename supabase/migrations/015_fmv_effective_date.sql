-- FMV rate date: FX is applied for this calendar date, not when the row was inserted.
alter table fmv_entries
  add column if not exists effective_date date;

update fmv_entries
set effective_date = fx_rate_date
where effective_date is null;

alter table fmv_entries
  alter column effective_date set not null;

create index if not exists fmv_entries_clerk_effective_date_idx
  on fmv_entries (clerk_user_id, effective_date desc);
