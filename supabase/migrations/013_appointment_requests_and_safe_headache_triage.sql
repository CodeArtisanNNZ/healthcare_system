begin;

alter table public.symptom_rules
  add column if not exists patient_guidance text;

create table if not exists public.appointment_requests (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  specialty_id uuid references public.specialties(id) on delete set null,
  requested_doctor_id uuid references public.doctors(id) on delete set null,
  assigned_doctor_id uuid references public.doctors(id) on delete set null,
  preferred_date date not null,
  preferred_time_start time not null,
  preferred_time_end time not null,
  alternate_date date,
  alternate_time_start time,
  alternate_time_end time,
  budget_min numeric not null check (budget_min >= 0),
  budget_max numeric not null check (budget_max >= budget_min),
  area text not null check (length(trim(area)) between 2 and 120),
  concern_summary text check (concern_summary is null or length(concern_summary) <= 1200),
  status text not null default 'Requested' check (status in ('Requested','Reviewing','Confirmed','Declined','Cancelled','Completed')),
  confirmed_at timestamptz,
  confirmed_time timestamptz,
  contact_info text,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (preferred_time_end > preferred_time_start),
  check ((alternate_date is null and alternate_time_start is null and alternate_time_end is null) or
         (alternate_date is not null and alternate_time_start is not null and alternate_time_end > alternate_time_start))
);

create table if not exists public.appointment_request_candidates (
  request_id uuid not null references public.appointment_requests(id) on delete cascade,
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  preference_rank smallint not null check (preference_rank between 1 and 3),
  primary key (request_id, doctor_id),
  unique (request_id, preference_rank)
);

create table if not exists public.appointment_request_events (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.appointment_requests(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  from_status text,
  to_status text not null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists appointment_requests_patient_created_idx on public.appointment_requests(patient_id, created_at desc);
create index if not exists appointment_requests_status_created_idx on public.appointment_requests(status, created_at);
create index if not exists appointment_requests_assigned_idx on public.appointment_requests(assigned_doctor_id) where assigned_doctor_id is not null;
create index if not exists appointment_requests_requested_doctor_idx on public.appointment_requests(requested_doctor_id) where requested_doctor_id is not null;
create index if not exists appointment_requests_specialty_idx on public.appointment_requests(specialty_id) where specialty_id is not null;
create index if not exists appointment_candidates_doctor_idx on public.appointment_request_candidates(doctor_id);
create index if not exists appointment_events_request_idx on public.appointment_request_events(request_id, created_at);
create index if not exists appointment_events_actor_idx on public.appointment_request_events(actor_id) where actor_id is not null;

alter table public.appointment_requests enable row level security;
alter table public.appointment_request_candidates enable row level security;
alter table public.appointment_request_events enable row level security;

revoke all on public.appointment_requests, public.appointment_request_candidates, public.appointment_request_events from anon, authenticated;
grant select, insert, update on public.appointment_requests to authenticated;
grant select, insert on public.appointment_request_candidates to authenticated;
grant select, insert on public.appointment_request_events to authenticated;

create policy appointment_request_read on public.appointment_requests for select to authenticated
  using (patient_id = (select auth.uid()) or (select public.is_admin()));
create policy appointment_request_insert on public.appointment_requests for insert to authenticated
  with check (patient_id = (select auth.uid()) and status = 'Requested' and assigned_doctor_id is null and confirmed_at is null);
create policy appointment_request_admin_update on public.appointment_requests for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create policy appointment_candidate_read on public.appointment_request_candidates for select to authenticated
  using ((select public.is_admin()) or request_id in (select id from public.appointment_requests where patient_id = (select auth.uid())));
create policy appointment_candidate_insert on public.appointment_request_candidates for insert to authenticated
  with check (request_id in (select id from public.appointment_requests where patient_id = (select auth.uid()) and status = 'Requested'));

create policy appointment_event_read on public.appointment_request_events for select to authenticated
  using ((select public.is_admin()) or request_id in (select id from public.appointment_requests where patient_id = (select auth.uid())));
create policy appointment_event_insert on public.appointment_request_events for insert to authenticated
  with check ((select public.is_admin()) or (actor_id = (select auth.uid()) and request_id in (select id from public.appointment_requests where patient_id = (select auth.uid()))));

grant all on public.appointment_requests, public.appointment_request_candidates, public.appointment_request_events to service_role;
grant usage, select on sequence public.appointment_request_events_id_seq to authenticated, service_role;

with generalist as (
  select id from public.specialties where lower(name) in ('general physician','medicine specialist','general medicine')
  order by case lower(name) when 'general physician' then 1 when 'medicine specialist' then 2 else 3 end limit 1
)
update public.symptom_rules r
set specialty_id = g.id,
    priority = 48,
    emergency_notice = null,
    patient_guidance = 'A mild, occasional headache often improves with water, rest, regular food and less screen strain. If it persists, recurs, or worries you, start with a General Physician or Medicine doctor. This is not a diagnosis.'
from generalist g
where lower(trim(r.keyword)) in ('headache','normal headache','mild headache','matha betha','মাথা ব্যথা','মাথাব্যথা');

update public.symptom_rules
set patient_guidance = 'A severe, sudden, one-sided or repeatedly worsening headache needs clinical assessment. Migraine is one possible cause, but only a clinician can assess the cause. Seek urgent help for sudden worst-ever pain, weakness, confusion, fainting, seizure, fever with a stiff neck, or headache after a serious injury.'
where lower(keyword) like '%severe headache%' or lower(keyword) like '%one sided headache%' or lower(keyword) like '%headache with%';

create or replace function public.resolve_doctor_triage_multi(query_text text)
returns jsonb language plpgsql stable security invoker set search_path = public, extensions as $$
declare q text := lower(trim(coalesce(query_text,''))); result jsonb;
begin
  if auth.uid() is null or not public.is_active() then raise exception 'Authentication required'; end if;
  if length(q)=0 then return jsonb_build_object('urgent',false,'emergency_notice',null,'patient_guidance',null,'primary_specialty_id',null,'primary_specialty_name',null,'suggestions','[]'::jsonb); end if;
  if length(q)>500 then raise exception 'Search too long'; end if;
  with matched as (
    select r.id,r.keyword,r.specialty_id,s.name specialty_name,r.priority,r.emergency_notice,r.patient_guidance,
      case when q=lower(trim(r.keyword)) then 1.15 when position(lower(trim(r.keyword)) in q)>0 then 1.0+least(.10,length(trim(r.keyword))::numeric/greatest(length(q),1)::numeric*.10)
      when word_similarity(lower(trim(r.keyword)),q)>=.72 then word_similarity(lower(trim(r.keyword)),q)*.95
      when similarity(lower(trim(r.keyword)),q)>=.62 then similarity(lower(trim(r.keyword)),q)*.88 else 0 end strength
    from public.symptom_rules r join public.specialties s on s.id=r.specialty_id
    where position(lower(trim(r.keyword)) in q)>0 or word_similarity(lower(trim(r.keyword)),q)>=.72 or similarity(lower(trim(r.keyword)),q)>=.62
  ), useful as (select * from matched where strength>0), scored as (
    select specialty_id,specialty_name,sum(strength*(1+least(priority,140)::numeric/220)) score,max(priority) top_priority,count(*) matched_count,
      jsonb_agg(jsonb_build_object('phrase',keyword,'strength',round(strength::numeric,3)) order by strength desc,priority desc,length(keyword) desc) matched_symptoms
    from useful group by specialty_id,specialty_name
  ), top_specialties as (select * from scored order by score desc,top_priority desc,matched_count desc,specialty_name limit 3),
  primary_row as (select * from top_specialties order by score desc,top_priority desc,matched_count desc,specialty_name limit 1),
  emergency_row as (select emergency_notice from useful where emergency_notice is not null and trim(emergency_notice)<>'' order by priority desc,strength desc limit 1),
  guidance_row as (select patient_guidance from useful where patient_guidance is not null and trim(patient_guidance)<>'' order by strength desc,priority desc limit 1)
  select jsonb_build_object('urgent',exists(select 1 from emergency_row),'emergency_notice',(select emergency_notice from emergency_row),'patient_guidance',(select patient_guidance from guidance_row),
    'primary_specialty_id',(select specialty_id from primary_row),'primary_specialty_name',(select specialty_name from primary_row),
    'suggestions',coalesce((select jsonb_agg(jsonb_build_object('specialty_id',t.specialty_id,'specialty_name',t.specialty_name,'score',round(t.score::numeric,3),'matched_count',t.matched_count,'matched_symptoms',t.matched_symptoms) order by t.score desc,t.top_priority desc,t.matched_count desc,t.specialty_name) from top_specialties t),'[]'::jsonb)) into result;
  return result;
end; $$;

revoke all on function public.resolve_doctor_triage_multi(text) from public;
grant execute on function public.resolve_doctor_triage_multi(text) to authenticated;

commit;
