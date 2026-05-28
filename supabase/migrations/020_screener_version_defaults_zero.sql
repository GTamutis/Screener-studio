-- New screeners default to v0.0 (major 0, minor 0).
alter table screeners
  alter column major_version set default 0,
  alter column minor_version set default 0;
