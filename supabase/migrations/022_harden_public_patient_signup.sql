-- Make public patient account creation independent of Supabase's restricted built-in SMTP.
-- The application calls this quota function only with the server-side service role.

create table if not exists public.signup_limits (
  key_hash text primary key,
  window_start timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0),
  updated_at timestamptz not null default now()
);

alter table public.signup_limits enable row level security;
revoke all on public.signup_limits from public, anon, authenticated;
grant select, insert, update, delete on public.signup_limits to service_role;

create or replace function public.consume_signup_quota(
  p_key_hash text,
  p_max_attempts integer default 8,
  p_window_minutes integer default 60
)
returns boolean
language plpgsql
security definer
set search_path to ''
as $$
declare
  current_attempts integer;
begin
  if length(coalesce(p_key_hash,'')) < 32 then return false; end if;

  insert into public.signup_limits(key_hash,window_start,attempts,updated_at)
  values(p_key_hash,now(),1,now())
  on conflict (key_hash) do update
  set attempts = case
        when public.signup_limits.window_start < now() - make_interval(mins => p_window_minutes)
          then 1
        else public.signup_limits.attempts + 1
      end,
      window_start = case
        when public.signup_limits.window_start < now() - make_interval(mins => p_window_minutes)
          then now()
        else public.signup_limits.window_start
      end,
      updated_at = now()
  returning attempts into current_attempts;

  return current_attempts <= p_max_attempts;
end;
$$;

revoke all on function public.consume_signup_quota(text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_signup_quota(text,integer,integer) to service_role;

create or replace function public.handle_auth_user()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  insert into public.profiles(id,full_name,email,phone,address,role,status)
  values(
    new.id,
    left(coalesce(new.raw_user_meta_data->>'full_name',''),300),
    coalesce(new.email,''),
    nullif(left(coalesce(new.raw_user_meta_data->>'phone',''),100),''),
    nullif(left(coalesce(new.raw_user_meta_data->>'address',''),4000),''),
    'patient',
    'Active'
  )
  on conflict (id) do update
  set full_name=excluded.full_name,
      email=excluded.email,
      phone=coalesce(excluded.phone,public.profiles.phone),
      address=coalesce(excluded.address,public.profiles.address);

  return new;
end;
$$;

revoke all on function public.handle_auth_user() from public, anon, authenticated;
