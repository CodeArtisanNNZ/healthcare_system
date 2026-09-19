-- Persist Healthcare Central Assistant conversations so authorized admins can review patient chats.
begin;

create table if not exists public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (length(trim(content)) between 1 and 5000),
  category text check (category is null or category in ('doctor','medicine','hospital','lab-test','caregiver','ambulance')),
  requested_category text check (requested_category is null or requested_category in ('doctor','medicine','hospital','lab-test','caregiver','ambulance')),
  location text,
  urgent boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists assistant_messages_user_created_idx
  on public.assistant_messages(user_id, created_at desc);

create index if not exists assistant_messages_created_idx
  on public.assistant_messages(created_at desc);

alter table public.assistant_messages enable row level security;

revoke all on public.assistant_messages from anon, authenticated;
grant select on public.assistant_messages to authenticated;
grant all on public.assistant_messages to service_role;

drop policy if exists assistant_messages_read on public.assistant_messages;
create policy assistant_messages_read
on public.assistant_messages
for select
to authenticated
using (
  (user_id = (select auth.uid()) and public.is_active())
  or public.is_admin()
);

commit;
