
begin;

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

create table if not exists public.search_aliases (
  id uuid primary key default gen_random_uuid(),
  alias text not null,
  canonical_term text not null,
  category text not null check (
    category in ('doctor','medicine','hospital','lab-test','caregiver','ambulance')
  ),
  specialty_id uuid references public.specialties(id) on delete set null,
  language text not null default 'English',
  created_at timestamptz not null default now(),
  unique(alias, category)
);

alter table public.search_aliases enable row level security;

revoke all on public.search_aliases from anon, authenticated;
grant select on public.search_aliases to authenticated;
grant insert, update, delete on public.search_aliases to authenticated;

drop policy if exists assistant_alias_read on public.search_aliases;
create policy assistant_alias_read
on public.search_aliases
for select
to authenticated
using(public.is_active());

drop policy if exists assistant_alias_admin_insert on public.search_aliases;
create policy assistant_alias_admin_insert
on public.search_aliases
for insert
to authenticated
with check(public.is_admin());

drop policy if exists assistant_alias_admin_update on public.search_aliases;
create policy assistant_alias_admin_update
on public.search_aliases
for update
to authenticated
using(public.is_admin())
with check(public.is_admin());

drop policy if exists assistant_alias_admin_delete on public.search_aliases;
create policy assistant_alias_admin_delete
on public.search_aliases
for delete
to authenticated
using(public.is_admin());

with seed(alias, canonical_term, category, specialty_hint, language) as (
  values
    ('matha betha','headache','doctor','neuro','Banglish'),
    ('matha byatha','headache','doctor','neuro','Banglish'),
    ('matha bethaa','headache','doctor','neuro','Banglish'),
    ('মাথা ব্যথা','headache','doctor','neuro','Bangla'),
    ('head ache','headache','doctor','neuro','English'),
    ('hedache','headache','doctor','neuro','English'),

    ('datar betha','tooth pain','doctor','dent','Banglish'),
    ('dater betha','tooth pain','doctor','dent','Banglish'),
    ('দাঁতের ব্যথা','tooth pain','doctor','dent','Bangla'),
    ('tooth ache','tooth pain','doctor','dent','English'),

    ('heart doctor','cardiology','doctor','cardio','English'),
    ('heart er doctor','cardiology','doctor','cardio','Banglish'),
    ('হার্ট ডাক্তার','cardiology','doctor','cardio','Bangla'),

    ('skin doctor','dermatology','doctor','derma','English'),
    ('skin er doctor','dermatology','doctor','derma','Banglish'),
    ('চর্ম ডাক্তার','dermatology','doctor','derma','Bangla'),

    ('eye doctor','ophthalmology','doctor','ophthal','English'),
    ('chokher doctor','ophthalmology','doctor','ophthal','Banglish'),
    ('চোখের ডাক্তার','ophthalmology','doctor','ophthal','Bangla'),

    ('child doctor','pediatrics','doctor','pedia','English'),
    ('bacchar doctor','pediatrics','doctor','pedia','Banglish'),
    ('শিশু ডাক্তার','pediatrics','doctor','pedia','Bangla')
)
insert into public.search_aliases(
  alias,
  canonical_term,
  category,
  specialty_id,
  language
)
select
  seed.alias,
  seed.canonical_term,
  seed.category,
  (
    select s.id
    from public.specialties s
    where lower(s.name) like '%' || lower(seed.specialty_hint) || '%'
    order by s.name
    limit 1
  ),
  seed.language
from seed
on conflict(alias, category) do nothing;

create or replace function public.resolve_assistant_query(
  query_text text,
  category_hint text
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
declare
  alias_match record;
  symptom_match record;
begin
  if auth.uid() is null or not public.is_active() then
    raise exception 'Authentication required';
  end if;

  if length(query_text) > 160 then
    raise exception 'Search too long';
  end if;

  select
    a.canonical_term,
    a.specialty_id,
    s.name as specialty_name
  into alias_match
  from public.search_aliases a
  left join public.specialties s on s.id = a.specialty_id
  where a.category = category_hint
    and (
      position(lower(a.alias) in lower(query_text)) > 0
      or similarity(lower(a.alias), lower(query_text)) >= 0.30
      or word_similarity(lower(a.alias), lower(query_text)) >= 0.42
    )
  order by
    case
      when lower(a.alias) = lower(trim(query_text)) then 0
      when position(lower(a.alias) in lower(query_text)) > 0 then 1
      else 2
    end,
    greatest(
      similarity(lower(a.alias), lower(query_text)),
      word_similarity(lower(a.alias), lower(query_text))
    ) desc
  limit 1;

  if alias_match.canonical_term is not null then
    return jsonb_build_object(
      'canonical_term', alias_match.canonical_term,
      'specialty_id', alias_match.specialty_id,
      'specialty_name', alias_match.specialty_name
    );
  end if;

  if category_hint = 'doctor' then
    select
      r.keyword as canonical_term,
      r.specialty_id,
      s.name as specialty_name
    into symptom_match
    from public.symptom_rules r
    join public.specialties s on s.id = r.specialty_id
    where
      position(lower(r.keyword) in lower(query_text)) > 0
      or similarity(lower(r.keyword), lower(query_text)) >= 0.30
      or word_similarity(lower(r.keyword), lower(query_text)) >= 0.42
    order by
      case
        when position(lower(r.keyword) in lower(query_text)) > 0 then 0
        else 1
      end,
      r.priority desc,
      greatest(
        similarity(lower(r.keyword), lower(query_text)),
        word_similarity(lower(r.keyword), lower(query_text))
      ) desc
    limit 1;

    if symptom_match.canonical_term is not null then
      return jsonb_build_object(
        'canonical_term', symptom_match.canonical_term,
        'specialty_id', symptom_match.specialty_id,
        'specialty_name', symptom_match.specialty_name
      );
    end if;
  end if;

  return jsonb_build_object(
    'canonical_term', trim(query_text),
    'specialty_id', null,
    'specialty_name', null
  );
end;
$$;

revoke all on function public.resolve_assistant_query(text,text) from public;
grant execute on function public.resolve_assistant_query(text,text) to authenticated;

create or replace function public.assistant_search_directory(
  entity text,
  q text default '',
  location_filter text default '',
  page_number integer default 1
)
returns setof jsonb
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
declare
  offset_rows integer :=
    (greatest(1, least(page_number, 10000)) - 1) * 24;
  q_text text := lower(trim(q));
  location_text text := lower(trim(location_filter));
begin
  if auth.uid() is null or not public.is_active() then
    raise exception 'Authentication required';
  end if;

  if length(q) > 160 then
    raise exception 'Search too long';
  end if;

  if length(location_filter) > 100 then
    raise exception 'Location filter too long';
  end if;

  if entity = 'doctors' then
    return query
    select to_jsonb(t)
    from public.doctors t
    left join public.specialties s on s.id = t.specialty_id
    where t.status = 'Active'
      and (
        q_text = ''
        or lower(concat_ws(
          ' ',
          t.full_name,
          t.specialization,
          t.qualification,
          t.location,
          s.name
        )) like '%' || q_text || '%'
        or similarity(
          lower(concat_ws(
            ' ',
            t.full_name,
            t.specialization,
            t.qualification,
            t.location,
            s.name
          )),
          q_text
        ) >= 0.16
        or word_similarity(
          q_text,
          lower(concat_ws(
            ' ',
            t.full_name,
            t.specialization,
            t.qualification,
            t.location,
            s.name
          ))
        ) >= 0.28
      )
      and (
        location_text = ''
        or lower(coalesce(t.location, '')) like '%' || location_text || '%'
      )
    order by
      case
        when lower(concat_ws(
          ' ',
          t.full_name,
          t.specialization,
          t.qualification,
          t.location,
          s.name
        )) like '%' || q_text || '%' then 0
        else 1
      end,
      word_similarity(
        q_text,
        lower(concat_ws(
          ' ',
          t.full_name,
          t.specialization,
          t.qualification,
          t.location,
          s.name
        ))
      ) desc,
      t.experience desc nulls last,
      t.full_name,
      t.id
    limit 24 offset offset_rows;
    return;
  end if;

  if entity = 'hospitals' then
    return query
    select to_jsonb(t)
    from public.hospitals t
    where t.status = 'Active'
      and (
        q_text = ''
        or lower(concat_ws(
          ' ',
          t.name,
          t.departments,
          t.location,
          t.address
        )) like '%' || q_text || '%'
        or similarity(
          lower(concat_ws(
            ' ',
            t.name,
            t.departments,
            t.location,
            t.address
          )),
          q_text
        ) >= 0.16
        or word_similarity(
          q_text,
          lower(concat_ws(
            ' ',
            t.name,
            t.departments,
            t.location,
            t.address
          ))
        ) >= 0.28
      )
      and (
        location_text = ''
        or lower(concat_ws(' ', t.location, t.address))
          like '%' || location_text || '%'
      )
    order by
      case
        when lower(concat_ws(
          ' ',
          t.name,
          t.departments,
          t.location,
          t.address
        )) like '%' || q_text || '%' then 0
        else 1
      end,
      word_similarity(
        q_text,
        lower(concat_ws(
          ' ',
          t.name,
          t.departments,
          t.location,
          t.address
        ))
      ) desc,
      t.name,
      t.id
    limit 24 offset offset_rows;
    return;
  end if;

  if entity = 'caregivers' then
    return query
    select to_jsonb(t)
    from public.caregivers t
    where t.status = 'Active'
      and (
        q_text = ''
        or lower(concat_ws(
          ' ',
          t.full_name,
          t.qualification,
          t.services,
          t.location
        )) like '%' || q_text || '%'
        or similarity(
          lower(concat_ws(
            ' ',
            t.full_name,
            t.qualification,
            t.services,
            t.location
          )),
          q_text
        ) >= 0.16
        or word_similarity(
          q_text,
          lower(concat_ws(
            ' ',
            t.full_name,
            t.qualification,
            t.services,
            t.location
          ))
        ) >= 0.28
      )
      and (
        location_text = ''
        or lower(coalesce(t.location, '')) like '%' || location_text || '%'
      )
    order by
      case
        when lower(concat_ws(
          ' ',
          t.full_name,
          t.qualification,
          t.services,
          t.location
        )) like '%' || q_text || '%' then 0
        else 1
      end,
      word_similarity(
        q_text,
        lower(concat_ws(
          ' ',
          t.full_name,
          t.qualification,
          t.services,
          t.location
        ))
      ) desc,
      t.full_name,
      t.id
    limit 24 offset offset_rows;
    return;
  end if;

  if entity = 'ambulances' then
    return query
    select to_jsonb(t)
    from public.ambulances t
    where t.status = 'Active'
      and (
        q_text = ''
        or lower(concat_ws(
          ' ',
          t.service_name,
          t.ambulance_type,
          t.hospital_name,
          t.location,
          t.city
        )) like '%' || q_text || '%'
        or similarity(
          lower(concat_ws(
            ' ',
            t.service_name,
            t.ambulance_type,
            t.hospital_name,
            t.location,
            t.city
          )),
          q_text
        ) >= 0.16
        or word_similarity(
          q_text,
          lower(concat_ws(
            ' ',
            t.service_name,
            t.ambulance_type,
            t.hospital_name,
            t.location,
            t.city
          ))
        ) >= 0.28
      )
      and (
        location_text = ''
        or lower(concat_ws(
          ' ',
          t.location,
          t.city,
          t.address,
          t.hospital_name
        )) like '%' || location_text || '%'
      )
    order by
      case
        when lower(concat_ws(
          ' ',
          t.service_name,
          t.ambulance_type,
          t.hospital_name,
          t.location,
          t.city
        )) like '%' || q_text || '%' then 0
        else 1
      end,
      word_similarity(
        q_text,
        lower(concat_ws(
          ' ',
          t.service_name,
          t.ambulance_type,
          t.hospital_name,
          t.location,
          t.city
        ))
      ) desc,
      t.service_name,
      t.id
    limit 24 offset offset_rows;
    return;
  end if;

  if entity = 'lab_tests' then
    return query
    select to_jsonb(t)
    from public.lab_tests t
    where t.status = 'Active'
      and (
        q_text = ''
        or lower(concat_ws(
          ' ',
          t.test_name,
          t.laboratory_name,
          t.category,
          t.location
        )) like '%' || q_text || '%'
        or similarity(
          lower(concat_ws(
            ' ',
            t.test_name,
            t.laboratory_name,
            t.category,
            t.location
          )),
          q_text
        ) >= 0.16
        or word_similarity(
          q_text,
          lower(concat_ws(
            ' ',
            t.test_name,
            t.laboratory_name,
            t.category,
            t.location
          ))
        ) >= 0.28
      )
      and (
        location_text = ''
        or lower(concat_ws(
          ' ',
          t.location,
          t.address,
          t.laboratory_name
        )) like '%' || location_text || '%'
      )
    order by
      case
        when lower(concat_ws(
          ' ',
          t.test_name,
          t.laboratory_name,
          t.category,
          t.location
        )) like '%' || q_text || '%' then 0
        else 1
      end,
      word_similarity(
        q_text,
        lower(concat_ws(
          ' ',
          t.test_name,
          t.laboratory_name,
          t.category,
          t.location
        ))
      ) desc,
      t.test_name,
      t.id
    limit 24 offset offset_rows;
    return;
  end if;

  if entity = 'medicines' then
    return query
    select to_jsonb(t)
    from public.medicines t
    where t.status = 'Active'
      and (
        q_text = ''
        or lower(concat_ws(' ', t.name, t.generic, t.strength))
          like '%' || q_text || '%'
        or similarity(
          lower(concat_ws(' ', t.name, t.generic, t.strength)),
          q_text
        ) >= 0.16
        or word_similarity(
          q_text,
          lower(concat_ws(' ', t.name, t.generic, t.strength))
        ) >= 0.28
      )
    order by
      case
        when lower(concat_ws(' ', t.name, t.generic, t.strength))
          like '%' || q_text || '%' then 0
        else 1
      end,
      word_similarity(
        q_text,
        lower(concat_ws(' ', t.name, t.generic, t.strength))
      ) desc,
      t.name,
      t.id
    limit 24 offset offset_rows;
    return;
  end if;

  raise exception 'Unknown directory';
end;
$$;

revoke all on function public.assistant_search_directory(text,text,text,integer)
from public;
grant execute on function public.assistant_search_directory(text,text,text,integer)
to authenticated;

commit;
