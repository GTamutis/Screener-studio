-- Align profiles.is_admin with app_users.role for users who already have a Clerk id
insert into profiles (id, is_admin, name)
select
  clerk_user_id,
  role = 'admin',
  display_name
from app_users
where clerk_user_id is not null
on conflict (id) do update set
  is_admin = excluded.is_admin,
  name = coalesce(excluded.name, profiles.name);
