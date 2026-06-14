-- Admin login using the application's own public.users and public.admin_users tables.
-- Run this in the Supabase SQL Editor for the project used by .env.local.
--
-- This does NOT use Supabase Auth's auth.users table.

create extension if not exists pgcrypto with schema extensions;

create table if not exists admin_sessions (
  token uuid primary key default gen_random_uuid(),
  user_id integer not null references users(id) on delete cascade,
  created_at timestamp not null default current_timestamp,
  expires_at timestamp not null default current_timestamp + interval '7 days'
);

create index if not exists idx_admin_sessions_user_id on admin_sessions(user_id);
create index if not exists idx_admin_sessions_expires_at on admin_sessions(expires_at);

-- Replace these values before running if you want a different initial admin.
insert into users (email, password_hash, full_name, role, status)
values (
  'admin@screenstudio.com',
  extensions.crypt('admin123', extensions.gen_salt('bf')),
  'Admin ScreenStudio',
  'admin',
  'active'
)
on conflict (email) do update
set
  password_hash = excluded.password_hash,
  full_name = excluded.full_name,
  role = 'admin',
  status = 'active',
  updated_at = current_timestamp;

insert into admin_users (
  user_id,
  permission_level,
  can_manage_users,
  can_manage_products,
  can_manage_orders,
  can_manage_content,
  can_manage_settings,
  can_view_analytics
)
select id, 'owner', true, true, true, true, true, true
from users
where email = 'admin@screenstudio.com' and role = 'admin'
on conflict (user_id) do update
set
  permission_level = excluded.permission_level,
  can_manage_users = excluded.can_manage_users,
  can_manage_products = excluded.can_manage_products,
  can_manage_orders = excluded.can_manage_orders,
  can_manage_content = excluded.can_manage_content,
  can_manage_settings = excluded.can_manage_settings,
  can_view_analytics = excluded.can_view_analytics,
  updated_at = current_timestamp;

create or replace function login_admin_user(p_email text, p_password text)
returns table (
  id integer,
  email text,
  full_name text,
  role text,
  status text,
  phone text,
  avatar_url text,
  created_at timestamp,
  updated_at timestamp,
  session_token uuid
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user users%rowtype;
  v_token uuid;
begin
  select u.*
  into v_user
  from users u
  join admin_users au on au.user_id = u.id
  where lower(u.email) = lower(p_email)
    and u.role = 'admin'
    and u.status = 'active';

  if not found or v_user.password_hash is null or v_user.password_hash <> extensions.crypt(p_password, v_user.password_hash::text) then
    raise exception 'Email atau password salah';
  end if;

  delete from admin_sessions where expires_at <= current_timestamp;

  insert into admin_sessions (user_id)
  values (v_user.id)
  returning token into v_token;

  update admin_users
  set last_login = current_timestamp, updated_at = current_timestamp
  where user_id = v_user.id;

  return query
  select
    v_user.id,
    v_user.email::text,
    v_user.full_name::text,
    v_user.role::text,
    v_user.status::text,
    v_user.phone::text,
    v_user.avatar_url::text,
    v_user.created_at,
    v_user.updated_at,
    v_token;
end;
$$;

create or replace function update_admin_email(p_session_token uuid, p_new_email text)
returns table (
  id integer,
  email text,
  full_name text,
  role text,
  status text,
  phone text,
  avatar_url text,
  created_at timestamp,
  updated_at timestamp
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id integer;
begin
  select s.user_id
  into v_user_id
  from admin_sessions s
  join users u on u.id = s.user_id
  join admin_users au on au.user_id = u.id
  where s.token = p_session_token
    and s.expires_at > current_timestamp
    and u.role = 'admin'
    and u.status = 'active';

  if v_user_id is null then
    raise exception 'Sesi admin tidak valid';
  end if;

  update users
  set email = lower(trim(p_new_email)), updated_at = current_timestamp
  where users.id = v_user_id;

  return query
  select
    u.id,
    u.email::text,
    u.full_name::text,
    u.role::text,
    u.status::text,
    u.phone::text,
    u.avatar_url::text,
    u.created_at,
    u.updated_at
  from users u
  where u.id = v_user_id;
end;
$$;

create or replace function update_admin_password(p_session_token uuid, p_current_password text, p_new_password text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user users%rowtype;
begin
  select u.*
  into v_user
  from admin_sessions s
  join users u on u.id = s.user_id
  join admin_users au on au.user_id = u.id
  where s.token = p_session_token
    and s.expires_at > current_timestamp
    and u.role = 'admin'
    and u.status = 'active';

  if not found then
    raise exception 'Sesi admin tidak valid';
  end if;

  if v_user.password_hash <> extensions.crypt(p_current_password, v_user.password_hash::text) then
    raise exception 'Password lama tidak sesuai';
  end if;

  update users
  set password_hash = extensions.crypt(p_new_password, extensions.gen_salt('bf')), updated_at = current_timestamp
  where id = v_user.id;
end;
$$;

grant execute on function login_admin_user(text, text) to anon, authenticated;
grant execute on function update_admin_email(uuid, text) to anon, authenticated;
grant execute on function update_admin_password(uuid, text, text) to anon, authenticated;
