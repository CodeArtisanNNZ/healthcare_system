begin;

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- Area-aware matching for Dhaka. Direct matches still win; these aliases cover
-- common administrative/neighbourhood naming differences in hospital records.
create or replace function public.location_matches(query_text text, candidate_text text)
returns boolean
language plpgsql
immutable
parallel safe
set search_path = public, extensions
as $$
declare
  q text := public.search_normalize(query_text);
  h text := public.search_normalize(candidate_text);
begin
  if q = '' then return true; end if;
  if h = '' then return false; end if;

  if h like '%' || q || '%' or word_similarity(q, h) >= 0.58 then
    return true;
  end if;

  return case
    when q in ('dhanmondi','panthapath','green road','kalabagan') then
      h like '%dhanmondi%' or h like '%panthapath%' or h like '%green road%' or h like '%kalabagan%'
    when q in ('mirpur','mirpur 1','mirpur 2','mirpur 10','mirpur 11','mirpur 12') then
      h like '%mirpur%' or h like '%pallabi%' or h like '%kafrul%' or h like '%shah ali%' or h like '%bhasan tek%' or h like '%darus salam%'
    when q in ('pallabi','kafrul','shah ali','bhasan tek','darus salam') then
      h like '%' || q || '%' or h like '%mirpur%'
    when q in ('uttara','uttara east','uttara west','uttara purba','uttara paschim') then
      h like '%uttara%' or h like '%turag%' or h like '%uttar khan%'
    when q in ('mohakhali','banani') then
      h like '%mohakhali%' or h like '%banani%'
    when q in ('gulshan','baridhara') then
      h like '%gulshan%' or h like '%baridhara%'
    when q in ('bashundhara','bhatara') then
      h like '%bashundhara%' or h like '%bhatara%'
    when q in ('agargaon','sher e bangla nagar','sher-e-bangla nagar','sher e bangla') then
      h like '%agargaon%' or h like '%sher e bangla%' or h like '%sher-e-bangla%'
    when q in ('bashabo','sabujbag') then
      h like '%bashabo%' or h like '%sabujbag%'
    when q in ('mugda','mugda para') then
      h like '%mugda%'
    when q = 'old dhaka' then
      h like '%bangshal%' or h like '%lalbag%' or h like '%kotwali%' or h like '%sutrapur%' or h like '%wari%' or h like '%gendaria%'
    else false
  end;
end;
$$;

-- Correct broad "Dhaka" labels where an official/government source gives a
-- more useful Dhaka-area location. Existing detailed addresses are preserved.
update public.hospitals set location='Kafrul / Mirpur 14, Dhaka, Bangladesh',
  address=coalesce(address,'Plot M-1/B & M-1/C, Section 14, Khanbahadur Ahsanullah Sarak, Mirpur, Dhaka-1206')
where lower(name)=lower('Ahsania Mission Cancer and General Hospital');

update public.hospitals set location='Dhanmondi, Dhaka, Bangladesh',
  address=coalesce(address,'House 17, Road 8, Dhanmondi, Dhaka-1205')
where lower(name)=lower('Anwer Khan Modern Medical College Hospital');

update public.hospitals set location='Dhanmondi / Mohammadpur, Dhaka, Bangladesh',
  address=coalesce(address,'78 Satmasjid Road, Dhanmondi, Dhaka-1205')
where lower(name)=lower('Bangladesh Eye Hospital & Institute');

update public.hospitals set location='Sher-e-Bangla Nagar, Dhaka, Bangladesh'
where lower(name) in (lower('Bangladesh Shishu Hospital & Institute'), lower('Bangladesh Shishu Hospital and Institute'));

update public.hospitals set location='Darus Salam / Mirpur, Dhaka, Bangladesh',
  address=coalesce(address,'26/2 Darus Salam Road, Mirpur, Dhaka')
where lower(name)=lower('Delta Hospital Ltd.');

update public.hospitals set location='Bhasan Tek / Mirpur, Dhaka, Bangladesh'
where lower(name)=lower('Dhaka Dental College Hospital');

update public.hospitals set location='Shahbag, Dhaka, Bangladesh'
where lower(name)=lower('Dhaka Medical College Hospital');

update public.hospitals set location='Panthapath / Sher-e-Bangla Nagar, Dhaka, Bangladesh'
where lower(name)=lower('Square Hospitals Ltd.');

update public.hospitals set location='Mohakhali / Banani, Dhaka, Bangladesh'
where lower(name)=lower('National Institute of Cancer Research and Hospital');

update public.hospitals set location='Sher-e-Bangla Nagar, Dhaka, Bangladesh'
where lower(name)=lower('National Institute of Cardiovascular Diseases');

update public.hospitals set location='Mohakhali, Dhaka, Bangladesh'
where lower(name)=lower('National Institute of Diseases of the Chest and Hospital');

update public.hospitals set location='Sher-e-Bangla Nagar, Dhaka, Bangladesh'
where lower(name)=lower('National Institute of Traumatology and Orthopaedic Rehabilitation');

-- Additional active Dhaka facilities verified against the DGHS Facility Registry.
with seed(name, location, phone, email, category, description) as (
  values
    ('Beraid Al-Helal Medical And Diagnostic Centre','Badda, Dhaka, Bangladesh','01850126881','aminakram086@gmail.com','General / Multidisciplinary','DGHS Facility Registry, facility ID 27088.'),
    ('Gulshan Maa O Shishu Clinic Ltd','Bhatara / Gulshan, Dhaka, Bangladesh','01819239993',null,'Women & Maternity','DGHS Facility Registry, facility ID 27505.'),
    ('Mirpur General Hospital & Diagnostic Centre (Rupnagar Branch)','Mirpur, Dhaka, Bangladesh',null,null,'General / Multidisciplinary','DGHS Facility Registry, facility ID 33002.'),
    ('Millennium Pangu Hospital & Diagnostic Complex','Uttara Purba, Dhaka, Bangladesh',null,null,'Orthopaedic & Trauma','DGHS Facility Registry, facility ID 26867.'),
    ('Farabi General Hospital Limited','Kalabagan / Dhanmondi, Dhaka, Bangladesh',null,null,'General / Multidisciplinary','DGHS Facility Registry, facility ID 26869.'),
    ('Brain & Mind Hospital (Pvt) Ltd','Tejgaon, Dhaka, Bangladesh',null,'brainandmindhospital@gmail.com','Mental Health','DGHS Facility Registry, facility ID 21733.'),
    ('Baridhara General Hospital Ltd.','Gulshan / Baridhara, Dhaka, Bangladesh',null,'bghospital.bd@gmail.com','General / Multidisciplinary','DGHS Facility Registry, facility ID 21735.'),
    ('Central Bashabo General Hospital Diagnostic Center','Bashabo / Khilgaon, Dhaka, Bangladesh',null,null,'General / Multidisciplinary','DGHS Facility Registry, facility ID 36816.'),
    ('ESTE Medical Bangladesh Limited','Banani, Dhaka, Bangladesh',null,null,'General / Multidisciplinary','DGHS Facility Registry, facility ID 36820.'),
    ('Omega Medical Complex Limited','Turag, Dhaka, Bangladesh',null,null,'General / Multidisciplinary','DGHS Facility Registry, facility ID 36821.'),
    ('Ad-din Barrister Rafique-ul-Huq Hospital','Shyampur, Dhaka, Bangladesh','01713488439','nahid@ad-din.org','General / Multidisciplinary','DGHS Facility Registry, facility ID 24632.'),
    ('The ENT & Head-Neck Cancer Hospital & Institute','Sher-e-Bangla Nagar, Dhaka, Bangladesh','01719323603','entcancerhospital@yahoo.com','ENT','DGHS Facility Registry, facility ID 31048.'),
    ('Banani Clinic Limited','Banani, Dhaka, Bangladesh',null,null,'General / Multidisciplinary','DGHS Facility Registry, facility ID 29992.'),
    ('Labaid Specialized Hospital Ltd.','Dhanmondi, Dhaka, Bangladesh',null,null,'Specialized','DGHS Facility Registry, facility ID 29993.'),
    ('Delta Health Care, Jatrabari Ltd.','Shyampur / Jatrabari, Dhaka, Bangladesh',null,null,'General / Multidisciplinary','DGHS Facility Registry, facility ID 25355.'),
    ('Hi-Care General Hospital Ltd. Unit-2','Uttara Paschim, Dhaka, Bangladesh',null,null,'General / Multidisciplinary','DGHS Facility Registry, facility ID 37305.')
)
insert into public.hospitals(name, location, phone, email, category, description, status)
select s.name, s.location, s.phone, s.email, s.category, s.description, 'Active'
from seed s
where not exists (
  select 1 from public.hospitals h
  where public.search_normalize(h.name)=public.search_normalize(s.name)
);

-- Doctor search: name > specialty/symptom > fuzzy free text. Location is applied
-- independently so a name search still works when an area is selected.
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
  sn text := public.search_normalize(specialty_filter);
  intent jsonb;
  intent_specialty uuid;
  offset_rows integer := (greatest(1, least(page_number, 10000)) - 1) * 24;
begin
  if auth.uid() is null or not public.is_active() then raise exception 'Authentication required'; end if;
  if length(query_text) > 160 then raise exception 'Search too long'; end if;
  if length(location_filter) > 100 then raise exception 'Location filter too long'; end if;
  if length(specialty_filter) > 120 then raise exception 'Specialty filter too long'; end if;

  if qn <> '' then
    intent := public.resolve_doctor_intent(query_text);
    if coalesce(intent->>'specialty_id','') <> '' then intent_specialty := (intent->>'specialty_id')::uuid; end if;
  end if;

  return query
  select to_jsonb(d)
  from public.doctors d
  left join public.specialties s on s.id=d.specialty_id
  where d.status='Active'
    and (
      sn='' or public.search_normalize(s.name)=sn
      or public.search_normalize(coalesce(d.specialization,'')) like '%'||sn||'%'
    )
    and public.location_matches(location_filter, concat_ws(' ',d.location,d.hospital_name))
    and (
      qn=''
      or public.search_normalize(d.full_name)=qn
      or public.search_normalize(d.full_name) like qn||'%'
      or public.search_normalize(d.full_name) like '%'||qn||'%'
      or similarity(public.search_normalize(d.full_name),qn)>=0.32
      or word_similarity(qn,public.search_normalize(d.full_name))>=0.50
      or (intent_specialty is not null and d.specialty_id=intent_specialty)
      or public.search_normalize(concat_ws(' ',d.specialization,d.qualification,d.hospital_name,s.name)) like '%'||qn||'%'
      or word_similarity(qn,public.search_normalize(concat_ws(' ',d.specialization,d.qualification,d.hospital_name,s.name)))>=0.45
    )
  order by
    case
      when qn='' then 5
      when public.search_normalize(d.full_name)=qn then 0
      when public.search_normalize(d.full_name) like qn||'%' then 1
      when public.search_normalize(d.full_name) like '%'||qn||'%' then 2
      when intent_specialty is not null and d.specialty_id=intent_specialty then 3
      else 4
    end,
    case when qn='' then 0 else greatest(
      similarity(public.search_normalize(d.full_name),qn),
      word_similarity(qn,public.search_normalize(d.full_name))
    ) end desc,
    lower(d.full_name), d.id
  limit 24 offset offset_rows;
end;
$$;

-- Hospital search: exact/partial names first, fuzzy spelling second, then
-- department/category text. Blank searches remain strictly A-Z.
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
  cn text := public.search_normalize(category_filter);
  offset_rows integer := (greatest(1, least(page_number, 10000)) - 1) * 24;
begin
  if auth.uid() is null or not public.is_active() then raise exception 'Authentication required'; end if;
  if length(query_text)>160 then raise exception 'Search too long'; end if;
  if length(location_filter)>100 then raise exception 'Location filter too long'; end if;
  if length(category_filter)>100 then raise exception 'Category filter too long'; end if;

  return query
  select to_jsonb(h)
  from public.hospitals h
  where h.status='Active'
    and (
      cn='' or public.search_normalize(coalesce(h.category,''))=cn
      or public.search_normalize(coalesce(h.departments,'')) like '%'||cn||'%'
      or public.search_normalize(h.name) like '%'||cn||'%'
    )
    and public.location_matches(location_filter,concat_ws(' ',h.location,h.address))
    and (
      qn=''
      or public.search_normalize(h.name)=qn
      or public.search_normalize(h.name) like qn||'%'
      or public.search_normalize(h.name) like '%'||qn||'%'
      or similarity(public.search_normalize(h.name),qn)>=0.30
      or word_similarity(qn,public.search_normalize(h.name))>=0.46
      or public.search_normalize(concat_ws(' ',h.category,h.departments,h.location,h.address,h.description)) like '%'||qn||'%'
      or word_similarity(qn,public.search_normalize(concat_ws(' ',h.category,h.departments,h.location,h.address)))>=0.43
    )
  order by
    case
      when qn='' then 5
      when public.search_normalize(h.name)=qn then 0
      when public.search_normalize(h.name) like qn||'%' then 1
      when public.search_normalize(h.name) like '%'||qn||'%' then 2
      else 3
    end,
    case when qn='' then 0 else greatest(
      similarity(public.search_normalize(h.name),qn),
      word_similarity(qn,public.search_normalize(h.name))
    ) end desc,
    lower(h.name), h.id
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
  offset_rows integer := (greatest(1, least(page_number, 10000)) - 1) * 24;
begin
  if auth.uid() is null or not public.is_active() then raise exception 'Authentication required'; end if;
  if length(query_text)>160 then raise exception 'Search too long'; end if;
  if length(location_filter)>100 then raise exception 'Location filter too long'; end if;

  return query
  select to_jsonb(c)
  from public.caregivers c
  where c.status='Active'
    and public.location_matches(location_filter,c.location)
    and (
      qn=''
      or public.search_normalize(c.full_name)=qn
      or public.search_normalize(c.full_name) like qn||'%'
      or public.search_normalize(c.full_name) like '%'||qn||'%'
      or similarity(public.search_normalize(c.full_name),qn)>=0.32
      or word_similarity(qn,public.search_normalize(c.full_name))>=0.48
      or public.search_normalize(concat_ws(' ',c.qualification,c.services,c.availability)) like '%'||qn||'%'
      or word_similarity(qn,public.search_normalize(concat_ws(' ',c.qualification,c.services,c.availability)))>=0.43
    )
  order by
    case
      when qn='' then 5
      when public.search_normalize(c.full_name)=qn then 0
      when public.search_normalize(c.full_name) like qn||'%' then 1
      when public.search_normalize(c.full_name) like '%'||qn||'%' then 2
      else 3
    end,
    case when qn='' then 0 else greatest(
      similarity(public.search_normalize(c.full_name),qn),
      word_similarity(qn,public.search_normalize(c.full_name))
    ) end desc,
    lower(c.full_name), c.id
  limit 24 offset offset_rows;
end;
$$;

revoke all on function public.location_matches(text,text) from public;
grant execute on function public.location_matches(text,text) to authenticated;
revoke all on function public.search_doctors_directory_v2(text,text,text,integer) from public;
revoke all on function public.search_hospitals_directory_v2(text,text,text,integer) from public;
revoke all on function public.search_caregivers_directory_v2(text,text,integer) from public;
grant execute on function public.search_doctors_directory_v2(text,text,text,integer) to authenticated;
grant execute on function public.search_hospitals_directory_v2(text,text,text,integer) to authenticated;
grant execute on function public.search_caregivers_directory_v2(text,text,integer) to authenticated;

commit;
