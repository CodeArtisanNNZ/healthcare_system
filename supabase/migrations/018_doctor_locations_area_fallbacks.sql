-- Area-aware doctor chambers and nearest-area fallback.

create table if not exists public.doctor_locations (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctors(id) on delete cascade,
  chamber_name text,
  address text,
  area text not null check (length(trim(area)) between 2 and 120),
  district text not null default 'Dhaka',
  available_days text,
  available_time text,
  consultation_fee numeric check (consultation_fee is null or consultation_fee >= 0),
  source_url text,
  verified_on date,
  verification_status text not null default 'Needs review'
    check (verification_status in ('Unverified','Needs review','Verified')),
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists doctor_locations_doctor_idx on public.doctor_locations(doctor_id);
create index if not exists doctor_locations_area_idx on public.doctor_locations(lower(area), doctor_id);

alter table public.doctor_locations enable row level security;

drop policy if exists doctor_locations_directory_read on public.doctor_locations;
create policy doctor_locations_directory_read on public.doctor_locations
for select to anon, authenticated
using (exists (
  select 1 from public.doctors d
  where d.id=doctor_id and (d.status='Active' or public.is_admin())
));

drop policy if exists doctor_locations_admin_insert on public.doctor_locations;
create policy doctor_locations_admin_insert on public.doctor_locations
for insert to authenticated with check (public.is_admin());

drop policy if exists doctor_locations_admin_update on public.doctor_locations;
create policy doctor_locations_admin_update on public.doctor_locations
for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists doctor_locations_admin_delete on public.doctor_locations;
create policy doctor_locations_admin_delete on public.doctor_locations
for delete to authenticated using (public.is_admin());

grant select on public.doctor_locations to anon, authenticated;
grant insert,update,delete on public.doctor_locations to authenticated;

create table if not exists public.healthcare_area_fallbacks (
  area text primary key,
  canonical_area text not null,
  nearby_areas text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.healthcare_area_fallbacks enable row level security;

drop policy if exists healthcare_area_fallbacks_read on public.healthcare_area_fallbacks;
create policy healthcare_area_fallbacks_read on public.healthcare_area_fallbacks
for select to anon, authenticated using (true);

drop policy if exists healthcare_area_fallbacks_admin_all on public.healthcare_area_fallbacks;
create policy healthcare_area_fallbacks_admin_all on public.healthcare_area_fallbacks
for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.healthcare_area_fallbacks to anon, authenticated;
grant insert,update,delete on public.healthcare_area_fallbacks to authenticated;

insert into public.healthcare_area_fallbacks(area,canonical_area,nearby_areas) values
('Adabor','Adabor',array['Mohammadpur','Shyamoli','Dhanmondi','Mirpur']::text[]),
('Aftabnagar','Aftabnagar',array['Badda','Banasree','Rampura','Bashundhara']::text[]),
('Agargaon','Agargaon',array['Mohammadpur','Mirpur','Mohakhali','Shahbag']::text[]),
('Azimpur','Azimpur',array['Shahbag','Dhanmondi','Wari']::text[]),
('Badda','Badda',array['Baridhara','Bashundhara','Rampura','Aftabnagar']::text[]),
('Banani','Banani',array['Gulshan','Mohakhali','Baridhara']::text[]),
('Banasree','Banasree',array['Rampura','Khilgaon','Badda']::text[]),
('Banglamotor','Banglamotor',array['Panthapath','Shahbag','Moghbazar','Dhanmondi']::text[]),
('Bangshal','Bangshal',array['Wari','Motijheel','Azimpur']::text[]),
('Baridhara','Baridhara',array['Gulshan','Badda','Bashundhara']::text[]),
('Basabo','Bashabo',array['Khilgaon','Banasree','Mugda','Malibagh']::text[]),
('Bashabo','Bashabo',array['Khilgaon','Banasree','Mugda','Malibagh']::text[]),
('Bashundhara','Bashundhara',array['Badda','Baridhara','Gulshan']::text[]),
('Bhasan Tek','Bhasan Tek',array['Mirpur','Mohakhali','Banani']::text[]),
('Bhatara','Bhatara',array['Badda','Bashundhara','Baridhara']::text[]),
('Cantonment','Cantonment',array['Mohakhali','Banani','Mirpur']::text[]),
('Dakshin Khan','Dakshinkhan',array['Uttara','Khilkhet','Nikunja']::text[]),
('Dakshinkhan','Dakshinkhan',array['Uttara','Khilkhet','Nikunja']::text[]),
('Darus Salam','Darus Salam',array['Mirpur','Mohammadpur','Shyamoli']::text[]),
('Demra','Demra',array['Jatrabari','Matuail','Khilgaon']::text[]),
('Dhaka','Dhaka','{}'::text[]),
('Dhanmondi','Dhanmondi',array['Panthapath','Mohammadpur','Shahbag']::text[]),
('Elephant Road','Elephant Road',array['Dhanmondi','Panthapath','New Market','Shahbag']::text[]),
('Eskaton','Eskaton',array['Moghbazar','Banglamotor','Malibagh']::text[]),
('Farmgate','Farmgate',array['Panthapath','Shahbag','Mohakhali']::text[]),
('Gendaria','Gendaria',array['Wari','Jatrabari','Motijheel']::text[]),
('Green Road','Green Road',array['Panthapath','Dhanmondi','Shahbag']::text[]),
('Gulshan','Gulshan',array['Banani','Baridhara','Mohakhali']::text[]),
('Hatirpool','Hatirpool',array['Dhanmondi','Panthapath','New Market']::text[]),
('Hazaribagh','Hazaribagh',array['Dhanmondi','Mohammadpur','Azimpur']::text[]),
('Jatrabari','Jatrabari',array['Wari','Khilgaon','Motijheel']::text[]),
('Kadamtali','Kadamtali',array['Jatrabari','Matuail','Shyampur']::text[]),
('Kafrul','Kafrul',array['Mirpur','Cantonment','Mohakhali']::text[]),
('Kalabagan','Kalabagan',array['Dhanmondi','Panthapath','Green Road']::text[]),
('Kamrangir Char','Kamrangirchar',array['Azimpur','Dhanmondi','Wari']::text[]),
('Kamrangirchar','Kamrangirchar',array['Azimpur','Dhanmondi','Wari']::text[]),
('Kazipara','Kazipara',array['Mirpur','Shewrapara','Kafrul']::text[]),
('Khilgaon','Khilgaon',array['Malibagh','Banasree','Rampura']::text[]),
('Khilkhet','Khilkhet',array['Uttara','Bashundhara','Nikunja']::text[]),
('Kotwali','Kotwali',array['Wari','Motijheel','Azimpur']::text[]),
('Kuril','Kuril',array['Bashundhara','Baridhara','Badda']::text[]),
('Lalbag','Lalbag',array['Azimpur','Wari','Dhanmondi']::text[]),
('Malibagh','Malibagh',array['Moghbazar','Khilgaon','Motijheel']::text[]),
('Matuail','Matuail',array['Jatrabari','Demra','Kadamtali']::text[]),
('Mirpur','Mirpur',array['Pallabi','Shyamoli','Mohammadpur']::text[]),
('Mirpur 1','Mirpur',array['Pallabi','Mohammadpur','Shyamoli']::text[]),
('Mirpur 10','Mirpur',array['Pallabi','Kafrul','Shewrapara']::text[]),
('Mirpur 11','Mirpur',array['Pallabi','Mirpur','Uttara']::text[]),
('Mirpur 12','Mirpur',array['Pallabi','Mirpur','Uttara']::text[]),
('Mirpur 14','Mirpur',array['Kafrul','Cantonment','Mohakhali']::text[]),
('Mirpur 2','Mirpur',array['Pallabi','Mohammadpur','Shyamoli']::text[]),
('Moghbazar','Moghbazar',array['Malibagh','Banglamotor','Panthapath']::text[]),
('Mohakhali','Mohakhali',array['Banani','Gulshan','Cantonment']::text[]),
('Mohammadpur','Mohammadpur',array['Shyamoli','Dhanmondi','Mirpur']::text[]),
('Motijheel','Motijheel',array['Shantinagar','Wari','Malibagh']::text[]),
('Mugda','Mugda',array['Khilgaon','Malibagh','Motijheel']::text[]),
('Mugda Para','Mugda',array['Khilgaon','Malibagh','Motijheel']::text[]),
('New Market','New Market',array['Dhanmondi','Azimpur','Shahbag']::text[]),
('Nikunja','Nikunja',array['Uttara','Khilkhet','Bashundhara']::text[]),
('Old Dhaka','Old Dhaka',array['Wari','Azimpur','Motijheel']::text[]),
('Pallabi','Pallabi',array['Mirpur','Uttara','Kafrul']::text[]),
('Paltan','Paltan',array['Motijheel','Shantinagar','Shahbag']::text[]),
('Panthapath','Panthapath',array['Dhanmondi','Shahbag','Banglamotor']::text[]),
('Ramna','Ramna',array['Shahbag','Motijheel','Panthapath']::text[]),
('Rampura','Rampura',array['Banasree','Khilgaon','Badda']::text[]),
('Rupnagar','Rupnagar',array['Mirpur','Pallabi','Uttara']::text[]),
('Sabujbag','Sabujbag',array['Khilgaon','Malibagh','Mugda']::text[]),
('Shah Ali','Shah Ali',array['Mirpur','Pallabi','Rupnagar']::text[]),
('Shahbag','Shahbag',array['Panthapath','Dhanmondi','Azimpur']::text[]),
('Shahjahanpur','Shahjahanpur',array['Motijheel','Malibagh','Khilgaon']::text[]),
('Shantinagar','Shantinagar',array['Motijheel','Malibagh','Moghbazar']::text[]),
('Sher-e-Bangla Nagar','Sher-e-Bangla Nagar',array['Agargaon','Mohammadpur','Mirpur','Mohakhali']::text[]),
('Shewrapara','Shewrapara',array['Mirpur','Kafrul','Kazipara']::text[]),
('Shyamoli','Shyamoli',array['Mohammadpur','Mirpur','Dhanmondi']::text[]),
('Shyampur','Shyampur',array['Jatrabari','Wari','Kadamtali']::text[]),
('Sutrapur','Sutrapur',array['Wari','Motijheel','Gendaria']::text[]),
('Tejgaon','Tejgaon',array['Mohakhali','Farmgate','Banani']::text[]),
('Tejgaon Ind. Area','Tejgaon Industrial Area',array['Mohakhali','Tejgaon','Gulshan']::text[]),
('Tejgaon Industrial Area','Tejgaon Industrial Area',array['Mohakhali','Tejgaon','Gulshan']::text[]),
('Turag','Turag',array['Uttara','Mirpur','Dakshinkhan']::text[]),
('Uttar Khan','Uttar Khan',array['Uttara','Dakshinkhan','Khilkhet']::text[]),
('Uttara','Uttara',array['Dakshinkhan','Uttar Khan','Nikunja']::text[]),
('Uttara East','Uttara',array['Dakshinkhan','Nikunja','Khilkhet']::text[]),
('Uttara Paschim','Uttara',array['Uttar Khan','Turag','Mirpur']::text[]),
('Uttara Purba','Uttara',array['Dakshinkhan','Nikunja','Khilkhet']::text[]),
('Uttara West','Uttara',array['Uttar Khan','Turag','Mirpur']::text[]),
('Wari','Wari',array['Motijheel','Jatrabari','Azimpur']::text[])
on conflict (area) do update
set canonical_area=excluded.canonical_area,
    nearby_areas=excluded.nearby_areas;

update public.doctors set area='Bashundhara',district='Dhaka'
where area is null and lower(coalesce(location,'')) like '%bashundhara%';
update public.doctors set area='Dhanmondi',district='Dhaka'
where area is null and lower(coalesce(location,'')) like '%dhanmondi%';
update public.doctors set area='Pallabi',district='Dhaka'
where area is null and lower(coalesce(location,'')) like '%pallabi%';

insert into public.doctor_locations(
  doctor_id,chamber_name,address,area,district,available_days,available_time,
  consultation_fee,source_url,verified_on,verification_status,is_primary
)
select d.id,coalesce(d.chamber_name,d.hospital_name),coalesce(d.chamber_address,d.location),
       d.area,coalesce(d.district,'Dhaka'),d.available_days,d.available_time,
       d.consultation_fee,d.source_url,d.verified_on,d.verification_status,true
from public.doctors d
where d.area is not null and coalesce(d.district,'Dhaka')='Dhaka'
  and not exists (
    select 1 from public.doctor_locations dl
    where dl.doctor_id=d.id and lower(dl.area)=lower(d.area)
  );

CREATE OR REPLACE FUNCTION public.search_doctors_directory_v3(query_text text DEFAULT ''::text, location_filter text DEFAULT ''::text, specialty_filter text DEFAULT ''::text, page_number integer DEFAULT 1)
 RETURNS SETOF jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  qn text := public.search_normalize(query_text);
  sn text := public.search_normalize(specialty_filter);
  intent jsonb;
  intent_specialty uuid;
  offset_rows integer := (greatest(1, least(page_number,10000))-1)*24;
  canonical text := trim(location_filter);
  nearby text[] := '{}';
begin
  if auth.uid() is null or not public.is_active() then
    raise exception 'Authentication required';
  end if;
  if length(query_text)>160 then raise exception 'Search too long'; end if;
  if length(location_filter)>100 then raise exception 'Location filter too long'; end if;
  if length(specialty_filter)>120 then raise exception 'Specialty filter too long'; end if;

  if qn<>'' then
    intent := public.resolve_doctor_intent(query_text);
    if coalesce(intent->>'specialty_id','')<>'' then
      intent_specialty := (intent->>'specialty_id')::uuid;
    end if;
  end if;

  if trim(location_filter)<>'' and public.search_normalize(location_filter)<>public.search_normalize('Dhaka') then
    select f.canonical_area,f.nearby_areas into canonical,nearby
    from public.healthcare_area_fallbacks f
    where public.search_normalize(f.area)=public.search_normalize(location_filter)
    limit 1;
    canonical := coalesce(canonical,trim(location_filter));
    nearby := coalesce(nearby,'{}');
  end if;

  return query
  with ranked as (
    select
      d,
      s.name as specialty_name,
      dl.id as location_id,
      dl.area as matched_area,
      dl.chamber_name as matched_chamber_name,
      dl.address as matched_address,
      dl.available_days as matched_days,
      dl.available_time as matched_time,
      dl.consultation_fee as matched_fee,
      coalesce(dl.loc_rank,0) as loc_rank
    from public.doctors d
    left join public.specialties s on s.id=d.specialty_id
    left join lateral (
      select
        x.*,
        case
          when trim(location_filter)='' or public.search_normalize(location_filter)=public.search_normalize('Dhaka') then 0
          when public.search_normalize(x.area)=public.search_normalize(canonical) then 0
          else coalesce((
            select ord::int
            from unnest(nearby) with ordinality n(area_name,ord)
            where public.search_normalize(n.area_name)=public.search_normalize(x.area)
            limit 1
          ),99)
        end as loc_rank
      from public.doctor_locations x
      where x.doctor_id=d.id
        and (
          trim(location_filter)=''
          or public.search_normalize(location_filter)=public.search_normalize('Dhaka')
          or public.search_normalize(x.area)=public.search_normalize(canonical)
          or exists (
            select 1 from unnest(nearby) n(area_name)
            where public.search_normalize(n.area_name)=public.search_normalize(x.area)
          )
        )
      order by loc_rank, x.is_primary desc, x.created_at
      limit 1
    ) dl on true
    where d.status='Active'
      and (sn='' or public.search_normalize(s.name)=sn or public.search_normalize(coalesce(d.specialization,'')) like '%'||sn||'%')
      and (
        trim(location_filter)=''
        or public.search_normalize(location_filter)=public.search_normalize('Dhaka')
        or dl.id is not null
      )
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
  )
  select
    to_jsonb(r.d)
    || jsonb_build_object(
      'area',coalesce(r.matched_area,(r.d).area),
      'chamber_name',coalesce(r.matched_chamber_name,(r.d).chamber_name),
      'chamber_address',coalesce(r.matched_address,(r.d).chamber_address),
      'available_days',coalesce(r.matched_days,(r.d).available_days),
      'available_time',coalesce(r.matched_time,(r.d).available_time),
      'consultation_fee',coalesce(r.matched_fee,(r.d).consultation_fee),
      '_requested_area',location_filter,
      '_matched_area',r.matched_area,
      '_nearby_fallback',(trim(location_filter)<>'' and r.loc_rank>0),
      '_location_rank',r.loc_rank
    )
  from ranked r
  order by
    r.loc_rank,
    case
      when qn='' then 5
      when public.search_normalize((r.d).full_name)=qn then 0
      when public.search_normalize((r.d).full_name) like qn||'%' then 1
      when public.search_normalize((r.d).full_name) like '%'||qn||'%' then 2
      when intent_specialty is not null and (r.d).specialty_id=intent_specialty then 3
      else 4
    end,
    case when qn='' then 0 else greatest(
      similarity(public.search_normalize((r.d).full_name),qn),
      word_similarity(qn,public.search_normalize((r.d).full_name))
    ) end desc,
    lower((r.d).full_name),(r.d).id
  limit 24 offset offset_rows;
end;
$function$


revoke all on function public.search_doctors_directory_v3(text,text,text,integer) from public;
grant execute on function public.search_doctors_directory_v3(text,text,text,integer) to authenticated;

CREATE OR REPLACE FUNCTION public.search_directory_filtered(entity text, q text DEFAULT ''::text, location_filter text DEFAULT ''::text, page_number integer DEFAULT 1)
 RETURNS SETOF jsonb
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
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
    return query select * from public.search_doctors_directory_v3(q, location_filter, '', page_number);
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
$function$

