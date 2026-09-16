begin;

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- Area-aware Dhaka matching. Search by a selected neighbourhood should return
-- records whose official address uses a nearby/administrative variant.
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

  -- Direct text matches always win. Fuzzy location matching is deliberately
  -- stricter than name matching so unrelated areas are not mixed together.
  if h like '%' || q || '%' or word_similarity(q, h) >= 0.66 then
    return true;
  end if;

  return case
    when q = 'dhaka' then h like '%dhaka%'

    when q in ('dhanmondi','panthapath','green road','kalabagan','hatirpool','elephant road','new market') then
      h like '%dhanmondi%' or h like '%panthapath%' or h like '%green road%' or h like '%kalabagan%' or h like '%hatirpool%' or h like '%elephant road%' or h like '%new market%'

    when q in ('mirpur','mirpur 1','mirpur 2','mirpur 10','mirpur 11','mirpur 12','mirpur 14','pallabi','kafrul','shah ali','bhasan tek','darus salam','kazipara','shewrapara','rupnagar') then
      h like '%mirpur%' or h like '%pallabi%' or h like '%kafrul%' or h like '%shah ali%' or h like '%bhasan tek%' or h like '%darus salam%' or h like '%kazipara%' or h like '%shewrapara%' or h like '%rupnagar%'

    when q in ('uttara','uttara east','uttara west','uttara purba','uttara paschim','turag','uttar khan','dakshin khan','dakshinkhan') then
      h like '%uttara%' or h like '%turag%' or h like '%uttar khan%' or h like '%dakshin khan%' or h like '%dakshinkhan%'

    when q in ('mohakhali','banani','tejgaon','tejgaon industrial area','tejgaon ind area','farmgate') then
      h like '%mohakhali%' or h like '%banani%' or h like '%tejgaon%' or h like '%farmgate%'

    when q in ('gulshan','baridhara') then
      h like '%gulshan%' or h like '%baridhara%'

    when q in ('bashundhara','bhatara','kuril','khilkhet','nikunja') then
      h like '%bashundhara%' or h like '%bhatara%' or h like '%kuril%' or h like '%khilkhet%' or h like '%nikunja%'

    when q in ('agargaon','sher e bangla nagar','sher e bangla','shyamoli') then
      h like '%agargaon%' or h like '%sher e bangla%' or h like '%shyamoli%'

    when q in ('rampura','banasree','aftabnagar') then
      h like '%rampura%' or h like '%banasree%' or h like '%aftabnagar%'

    when q in ('bashabo','basabo','sabujbag','khilgaon','malibagh','moghbazar','shahjahanpur') then
      h like '%bashabo%' or h like '%basabo%' or h like '%sabujbag%' or h like '%khilgaon%' or h like '%malibagh%' or h like '%moghbazar%' or h like '%shahjahanpur%'

    when q in ('mugda','mugda para') then
      h like '%mugda%'

    when q in ('jatrabari','shyampur','kadamtali','matuail','demra') then
      h like '%jatrabari%' or h like '%shyampur%' or h like '%kadamtali%' or h like '%matuail%' or h like '%demra%'

    when q in ('paltan','motijheel','shantinagar','ramna','eskaton','banglamotor') then
      h like '%paltan%' or h like '%motijheel%' or h like '%shantinagar%' or h like '%ramna%' or h like '%eskaton%' or h like '%banglamotor%'

    when q in ('old dhaka','bangshal','lalbag','kotwali','sutrapur','wari','gendaria','azimpur','hazaribagh','kamrangir char','kamrangirchar') then
      h like '%bangshal%' or h like '%lalbag%' or h like '%kotwali%' or h like '%sutrapur%' or h like '%wari%' or h like '%gendaria%' or h like '%azimpur%' or h like '%hazaribagh%' or h like '%kamrangir%'

    when q = 'cantonment' then h like '%cantonment%'
    else false
  end;
end;
$$;

-- Add newly verified Dhaka facilities from the DGHS Facility Registry.
with seed(name, location, category, description) as (
  values
    ('Bangladesh Multicare Hospital Ltd.','Rampura, Dhaka, Bangladesh','General / Multidisciplinary','DGHS Facility Registry, facility ID 34507.'),
    ('Supreme Medical Services Limited','Jatrabari, Dhaka, Bangladesh','General / Multidisciplinary','DGHS Facility Registry, facility ID 31126.'),
    ('Hikmah Eye Hospital Ltd.','Khilgaon, Dhaka, Bangladesh','Eye','DGHS Facility Registry, facility ID 30510.'),
    ('Farida Clinic & Infertility Management Center Limited','Paltan, Dhaka, Bangladesh','Women & Maternity','DGHS Facility Registry, facility ID 30546.')
)
insert into public.hospitals(name, location, category, description, status)
select s.name, s.location, s.category, s.description, 'Active'
from seed s
where not exists (
  select 1 from public.hospitals h
  where public.search_normalize(h.name)=public.search_normalize(s.name)
);

-- Refresh the registered Bangladesh Specialized Hospital record with the
-- current DGHS name/contact details instead of keeping a stale duplicate.
update public.hospitals
set name='Bangladesh Specialized Hospital PLC',
    location='Adabor, Dhaka, Bangladesh',
    phone=coalesce(phone,'01712592490'),
    email=coalesce(email,'tafhimur.83@gmail.com'),
    description=case
      when description is null or trim(description)='' then 'DGHS Facility Registry, facility ID 25216.'
      when description not ilike '%25216%' then description || ' DGHS Facility Registry, facility ID 25216.'
      else description
    end
where public.search_normalize(name) in (
  public.search_normalize('Bangladesh Specialized Hospital Ltd. (BSHL)'),
  public.search_normalize('Bangladesh Specialized Hospital PLC')
);

commit;
