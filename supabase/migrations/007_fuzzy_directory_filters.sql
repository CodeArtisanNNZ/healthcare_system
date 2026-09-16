begin;

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

alter table public.hospitals
  add column if not exists category text;

-- A lightweight primary-focus category for browsing. It is intentionally
-- separate from the free-text departments field so we do not pretend that a
-- name-derived category is a complete department list.
update public.hospitals
set category = case
  when lower(name) ~ '(eye|ophthalm)' then 'Eye'
  when lower(name) ~ '(heart|cardiac|cardiovascular|rheumatic)' then 'Cardiac'
  when lower(name) ~ '(cancer|oncolog)' then 'Cancer'
  when lower(name) ~ '(kidney|urolog)' then 'Kidney & Urology'
  when lower(name) ~ '(^|[^a-z])ent([^a-z]|$)' then 'ENT'
  when lower(name) ~ '(child|children|shishu|paediatric|pediatric)' then 'Children & Paediatrics'
  when lower(name) ~ '(women|mother|maternity|gynae|obstetric)' then 'Women & Maternity'
  when lower(name) ~ '(orthop|trauma)' then 'Orthopaedic & Trauma'
  when lower(name) ~ '(mental|psychiatr)' then 'Mental Health'
  when lower(name) ~ '(chest|tb hospital|asthma|respirat)' then 'Chest & Respiratory'
  when lower(name) ~ '(dental)' then 'Dental'
  when lower(name) ~ '(medical college|university hospital)' then 'Medical College / Teaching'
  when lower(name) ~ '(specialized|specialised|institute|foundation)' then 'Specialized'
  else 'General / Multidisciplinary'
end
where category is null or trim(category) = '';

-- Additional Dhaka facilities verified against the DGHS Facility Registry.
-- Duplicate protection is case-insensitive. Source IDs are kept in the
-- description for traceability rather than overloading legacy_id.
with seed(name, location, email, category, description) as (
  values
    ('National Institute Of Mental Health (NIMH)','Sher-e-Bangla Nagar, Dhaka, Bangladesh','nimhr@hospi.dghs.gov.bd','Mental Health','DGHS Facility Registry, facility ID 10.'),
    ('National Institute Of Ophthalmology (NIO)','Mohammadpur, Dhaka, Bangladesh','nio@hospi.dghs.gov.bd','Eye','DGHS Facility Registry, facility ID 11.'),
    ('Sarkari Karmachari Hospital - Fulbaria','Ramna, Dhaka, Bangladesh','geh@hospi.dghs.gov.bd','General / Multidisciplinary','DGHS Facility Registry, facility ID 32.'),
    ('Dhaka Leprosy Hospital','Dhaka, Bangladesh','dlh@hospi.dghs.gov.bd','Specialized','DGHS Facility Registry, facility ID 29.'),
    ('Shyamoli 250 Bed TB Hospital','Shyamoli, Dhaka, Bangladesh','ntbcp@hospi.dghs.gov.bd','Chest & Respiratory','DGHS Facility Registry, facility ID 50.'),
    ('University Dental College and Hospital','Paltan, Dhaka, Bangladesh',null,'Dental','DGHS Facility Registry, facility ID 31541.'),
    ('Dhanmondi Clinic (PVT) LTD.','Kalabagan, Dhaka, Bangladesh',null,'General / Multidisciplinary','DGHS Facility Registry, facility ID 31492.'),
    ('Womens & Childrens General Hospital','Dhanmondi, Dhaka, Bangladesh',null,'Women & Maternity','DGHS Facility Registry, facility ID 26008.'),
    ('Liver Gastric Specialized Hospital','Dhanmondi, Dhaka, Bangladesh','drshahidr54@gmail.com','Specialized','DGHS Facility Registry, facility ID 22050.'),
    ('Sumona Hospital Ltd','Kotwali, Dhaka, Bangladesh','sumonahospital1@gmail.com','General / Multidisciplinary','DGHS Facility Registry, facility ID 22051.'),
    ('MonNiramoy Psychiatric Hospital','Mirpur, Dhaka, Bangladesh','monniramoydhaka@gmail.com','Mental Health','DGHS Facility Registry, facility ID 27792.'),
    ('Islami Eye Hospital','Mohammadpur, Dhaka, Bangladesh',null,'Eye','DGHS Facility Registry, facility ID 37457.'),
    ('Riand Bangladesh Neuro - General Hospital','Mirpur, Dhaka, Bangladesh',null,'Specialized','DGHS Facility Registry, facility ID 37458.'),
    ('Take Care Hospital & Digital Diagnostic Center','Mirpur, Dhaka, Bangladesh',null,'General / Multidisciplinary','DGHS Facility Registry, facility ID 30243.'),
    ('Islami Bank Hospital Mugda','Mugda Para, Dhaka, Bangladesh','ibhmugda@gmail.com','General / Multidisciplinary','DGHS Facility Registry, facility ID 29430.'),
    ('Rupashi Bangla Hospital','Kadamtali, Dhaka, Bangladesh','mahbub.cse87@gmail.com','General / Multidisciplinary','DGHS Facility Registry, facility ID 29433.'),
    ('Chowdhury General Hospital','Bangshal, Dhaka, Bangladesh','cghdhaka@gmail.com','General / Multidisciplinary','DGHS Facility Registry, facility ID 28641.'),
    ('Delta Health Care, Rampura Ltd','Rampura, Dhaka, Bangladesh',null,'General / Multidisciplinary','DGHS Facility Registry, facility ID 30132.'),
    ('Senior Citizen Healthcare Limited - Baridhara','Baridhara / Gulshan, Dhaka, Bangladesh','info.seniorcitizenhealthcare@gmail.com','General / Multidisciplinary','DGHS Facility Registry, facility ID 27391.'),
    ('Medi-Bangla General Hospital & Diagnostic Centre','Jatrabari, Dhaka, Bangladesh','doctorarifhossain@gmail.com','General / Multidisciplinary','DGHS Facility Registry, facility ID 31742.'),
    ('National Asthma Center','Mohakhali / Banani, Dhaka, Bangladesh','nac@hospi.dghs.gov.bd','Chest & Respiratory','DGHS Facility Registry, facility ID 22.'),
    ('Bangladesh Secretariat Clinic','Paltan, Dhaka, Bangladesh','sc@cs.dghs.gov.bd','General / Multidisciplinary','DGHS Facility Registry, facility ID 20.')
)
insert into public.hospitals(name, location, email, category, description, status)
select s.name, s.location, s.email, s.category, s.description, 'Active'
from seed s
where not exists (
  select 1 from public.hospitals h
  where lower(trim(h.name)) = lower(trim(s.name))
);

create or replace function public.search_normalize(value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select trim(
    regexp_replace(
      regexp_replace(lower(coalesce(value, '')), '[[:punct:]]+', ' ', 'g'),
      '[[:space:]]+', ' ', 'g'
    )
  );
$$;

create or replace function public.search_doctors_directory_v2(
  query_text text default '',
  location_filter text default '',
  specialty_filter text default '',
  page_number integer default 1
)
returns setof jsonb
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
declare
  qn text := public.search_normalize(query_text);
  ln text := public.search_normalize(location_filter);
  sn text := public.search_normalize(specialty_filter);
  intent jsonb;
  intent_specialty uuid;
  offset_rows integer := (greatest(1, least(page_number, 10000)) - 1) * 24;
begin
  if auth.uid() is null or not public.is_active() then
    raise exception 'Authentication required';
  end if;
  if length(query_text) > 160 then raise exception 'Search too long'; end if;
  if length(location_filter) > 100 then raise exception 'Location filter too long'; end if;
  if length(specialty_filter) > 120 then raise exception 'Specialty filter too long'; end if;

  if qn <> '' then
    intent := public.resolve_doctor_intent(query_text);
    if coalesce(intent->>'specialty_id','') <> '' then
      intent_specialty := (intent->>'specialty_id')::uuid;
    end if;
  end if;

  return query
  select to_jsonb(d)
  from public.doctors d
  left join public.specialties s on s.id = d.specialty_id
  where d.status = 'Active'
    and (
      sn = ''
      or public.search_normalize(s.name) = sn
      or public.search_normalize(coalesce(d.specialization,'')) like '%' || sn || '%'
    )
    and (
      ln = ''
      or public.search_normalize(coalesce(d.location,'')) like '%' || ln || '%'
      or word_similarity(ln, public.search_normalize(coalesce(d.location,''))) >= 0.56
    )
    and (
      qn = ''
      or (intent_specialty is not null and d.specialty_id = intent_specialty)
      or public.search_normalize(d.full_name) like '%' || qn || '%'
      or similarity(public.search_normalize(d.full_name), qn) >= 0.34
      or word_similarity(qn, public.search_normalize(d.full_name)) >= 0.52
      or public.search_normalize(concat_ws(' ', d.full_name, d.specialization, d.qualification, d.hospital_name, d.location, s.name)) like '%' || qn || '%'
      or word_similarity(qn, public.search_normalize(concat_ws(' ', d.full_name, d.specialization, d.qualification, d.hospital_name, d.location, s.name))) >= 0.46
    )
  order by
    case
      when qn = '' then 5
      when public.search_normalize(d.full_name) = qn then 0
      when public.search_normalize(d.full_name) like qn || '%' then 1
      when public.search_normalize(d.full_name) like '%' || qn || '%' then 2
      when intent_specialty is not null and d.specialty_id = intent_specialty then 3
      else 4
    end,
    case when qn = '' then 0 else greatest(
      similarity(public.search_normalize(d.full_name), qn),
      word_similarity(qn, public.search_normalize(d.full_name)),
      word_similarity(qn, public.search_normalize(concat_ws(' ', d.specialization, d.qualification, s.name)))
    ) end desc,
    lower(d.full_name),
    d.id
  limit 24 offset offset_rows;
end;
$$;

create or replace function public.search_hospitals_directory_v2(
  query_text text default '',
  location_filter text default '',
  category_filter text default '',
  page_number integer default 1
)
returns setof jsonb
language plpgsql
stable
security invoker
set search_path = public, extensions
as $$
declare
  qn text := public.search_normalize(query_text);
  ln text := public.search_normalize(location_filter);
  cn text := public.search_normalize(category_filter);
  offset_rows integer := (greatest(1, least(page_number, 10000)) - 1) * 24;
begin
  if auth.uid() is null or not public.is_active() then
    raise exception 'Authentication required';
  end if;
  if length(query_text) > 160 then raise exception 'Search too long'; end if;
  if length(location_filter) > 100 then raise exception 'Location filter too long'; end if;
  if length(category_filter) > 100 then raise exception 'Category filter too long'; end if;

  return query
  select to_jsonb(h)
  from public.hospitals h
  where h.status = 'Active'
    and (
      cn = ''
      or public.search_normalize(coalesce(h.category,'')) = cn
      or public.search_normalize(coalesce(h.departments,'')) like '%' || cn || '%'
      or public.search_normalize(h.name) like '%' || cn || '%'
    )
    and (
      ln = ''
      or public.search_normalize(concat_ws(' ', h.location, h.address)) like '%' || ln || '%'
      or word_similarity(ln, public.search_normalize(concat_ws(' ', h.location, h.address))) >= 0.55
    )
    and (
      qn = ''
      or public.search_normalize(h.name) like '%' || qn || '%'
      or similarity(public.search_normalize(h.name), qn) >= 0.32
      or word_similarity(qn, public.search_normalize(h.name)) >= 0.48
      or public.search_normalize(concat_ws(' ', h.name, h.category, h.departments, h.location, h.address, h.description)) like '%' || qn || '%'
      or word_similarity(qn, public.search_normalize(concat_ws(' ', h.name, h.category, h.departments, h.location, h.address))) >= 0.44
    )
  order by
    case
      when qn = '' then 5
      when public.search_normalize(h.name) = qn then 0
      when public.search_normalize(h.name) like qn || '%' then 1
      when public.search_normalize(h.name) like '%' || qn || '%' then 2
      else 3
    end,
    case when qn = '' then 0 else greatest(
      similarity(public.search_normalize(h.name), qn),
      word_similarity(qn, public.search_normalize(h.name)),
      word_similarity(qn, public.search_normalize(concat_ws(' ', h.category, h.departments, h.location, h.address)))
    ) end desc,
    lower(h.name),
    h.id
  limit 24 offset offset_rows;
end;
$$;

create or replace function public.search_caregivers_directory_v2(
  query_text text default '',
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
  qn text := public.search_normalize(query_text);
  ln text := public.search_normalize(location_filter);
  offset_rows integer := (greatest(1, least(page_number, 10000)) - 1) * 24;
begin
  if auth.uid() is null or not public.is_active() then
    raise exception 'Authentication required';
  end if;
  if length(query_text) > 160 then raise exception 'Search too long'; end if;
  if length(location_filter) > 100 then raise exception 'Location filter too long'; end if;

  return query
  select to_jsonb(c)
  from public.caregivers c
  where c.status = 'Active'
    and (
      ln = ''
      or public.search_normalize(coalesce(c.location,'')) like '%' || ln || '%'
      or word_similarity(ln, public.search_normalize(coalesce(c.location,''))) >= 0.56
    )
    and (
      qn = ''
      or public.search_normalize(c.full_name) like '%' || qn || '%'
      or similarity(public.search_normalize(c.full_name), qn) >= 0.34
      or word_similarity(qn, public.search_normalize(c.full_name)) >= 0.50
      or public.search_normalize(concat_ws(' ', c.full_name, c.qualification, c.services, c.location, c.availability)) like '%' || qn || '%'
      or word_similarity(qn, public.search_normalize(concat_ws(' ', c.full_name, c.qualification, c.services, c.location))) >= 0.44
    )
  order by
    case
      when qn = '' then 5
      when public.search_normalize(c.full_name) = qn then 0
      when public.search_normalize(c.full_name) like qn || '%' then 1
      when public.search_normalize(c.full_name) like '%' || qn || '%' then 2
      else 3
    end,
    case when qn = '' then 0 else greatest(
      similarity(public.search_normalize(c.full_name), qn),
      word_similarity(qn, public.search_normalize(c.full_name))
    ) end desc,
    lower(c.full_name),
    c.id
  limit 24 offset offset_rows;
end;
$$;

revoke all on function public.search_doctors_directory_v2(text,text,text,integer) from public;
revoke all on function public.search_hospitals_directory_v2(text,text,text,integer) from public;
revoke all on function public.search_caregivers_directory_v2(text,text,integer) from public;
grant execute on function public.search_doctors_directory_v2(text,text,text,integer) to authenticated;
grant execute on function public.search_hospitals_directory_v2(text,text,text,integer) to authenticated;
grant execute on function public.search_caregivers_directory_v2(text,text,integer) to authenticated;

-- Keep the assistant and older callers on the same fuzzy engine.
create or replace function public.search_directory_filtered(
  entity text,
  q text default '',
  location_filter text default '',
  page_number integer default 1
)
returns setof jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  ordering text := 't.created_at desc,t.id';
  location_clause text := '';
begin
  if not entity = any(array[
    'doctors','hospitals','caregivers','ambulances','lab_tests',
    'medicines','medicine_offers','specialties','symptom_rules'
  ]) then raise exception 'Unknown directory'; end if;
  if length(q) > 160 then raise exception 'Search too long'; end if;
  if length(location_filter) > 100 then raise exception 'Location filter too long'; end if;

  if entity = 'doctors' then
    return query select * from public.search_doctors_directory_v2(q, location_filter, '', page_number);
    return;
  elsif entity = 'hospitals' then
    return query select * from public.search_hospitals_directory_v2(q, location_filter, '', page_number);
    return;
  elsif entity = 'caregivers' then
    return query select * from public.search_caregivers_directory_v2(q, location_filter, page_number);
    return;
  end if;

  if length(trim(location_filter)) > 0 then
    case entity
      when 'ambulances' then location_clause := ' and lower(concat_ws('' '', t.location, t.city, t.address, t.hospital_name)) like $4';
      when 'lab_tests' then location_clause := ' and lower(concat_ws('' '', t.location, t.address, t.laboratory_name)) like $4';
      else location_clause := '';
    end case;
  end if;

  return query execute format(
    'select to_jsonb(t) from public.%I t
     where lower(to_jsonb(t)::text) like $1 %s
     order by %s limit 24 offset $2',
    entity, location_clause, ordering
  ) using '%' || lower(q) || '%',
          (greatest(1,least(page_number,10000))-1)*24,
          q,
          '%' || lower(location_filter) || '%';
end;
$$;

revoke all on function public.search_directory_filtered(text,text,text,integer) from public;
grant execute on function public.search_directory_filtered(text,text,text,integer) to authenticated;

commit;
