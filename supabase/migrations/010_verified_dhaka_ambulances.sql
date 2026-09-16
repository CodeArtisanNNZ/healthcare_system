begin;

alter table public.ambulances add column if not exists alternate_phone text;
alter table public.ambulances add column if not exists coverage text;
alter table public.ambulances add column if not exists source_url text;
alter table public.ambulances add column if not exists verified_on date;

create index if not exists ambulances_location_lower_idx
  on public.ambulances ((lower(coalesce(location, ''))));
create index if not exists ambulances_city_lower_idx
  on public.ambulances ((lower(coalesce(city, ''))));

with seed(
  service_name, driver_name, driver_phone, alternate_phone, ambulance_type,
  location, address, city, hospital_name, availability, coverage,
  source_url, verified_on, status
) as (
  values
    ('Evercare Hospital Dhaka Ambulance', null, '01714-090000', '10678', 'Emergency / life-support ambulance',
      'Bashundhara', 'Plot 81, Block E, Bashundhara R/A, Dhaka 1229', 'Dhaka', 'Evercare Hospital Dhaka', '24/7', 'Dhaka citywide',
      'https://www.evercarebd.com/en/dhaka/specialities/accident-emergency', current_date, 'Active'),

    ('Green Life Hospital Ambulance', null, '01912-502025', '01768-896433', 'Hospital ambulance',
      'Green Road / Dhanmondi', '32 Green Road, Dhanmondi, Dhaka 1205', 'Dhaka', 'Green Life Hospital Ltd.', '24/7', 'Dhaka citywide',
      'https://greenlifehospital.com.bd/', current_date, 'Active'),

    ('Popular Medical College Hospital Ambulance', null, '09613-787800', '01811-455003', 'Hospital emergency ambulance',
      'Dhanmondi', 'House 08, Road 02, Dhanmondi, Dhaka 1205', 'Dhaka', 'Popular Medical College & Hospital Ltd.', '24/7 emergency service', 'Dhaka citywide',
      'https://popular-hospital.com/index.php/faqs', current_date, 'Active'),

    ('Asgar Ali Hospital Ambulance', null, '01787-683333', '01787-683334 / 01787-683335 / 10602', 'Cardiac and non-cardiac ambulance',
      'Gandaria', '111/1/A Distillery Road, Gandaria, Dhaka 1204', 'Dhaka', 'Asgar Ali Hospital', '24/7', 'Dhaka citywide',
      'https://www.asgaralihospital.com/page/ambulance-service', current_date, 'Active'),

    ('AMZ Hospital Ambulance', null, '01409-961020', '01847-331047 / 10699', 'Hospital ambulance',
      'Uttar Badda', 'Cha-80/3, Shadhinota Sarani, Progati Sarani Road, Uttar Badda, Dhaka 1212', 'Dhaka', 'AMZ Hospital Ltd.', '24/7', 'Dhaka citywide',
      'https://www.amzhospitalbd.com/services/ambulance-service', current_date, 'Active'),

    ('Aalok Healthcare Ambulance', null, '10672', '09610-100999', 'Ambulance service',
      'Mirpur 10', 'House 1 & 3, Road 2, Block B, Mirpur 10, Dhaka 1216', 'Dhaka', 'Aalok Healthcare Ltd.', '24/7', 'Mirpur, Pallabi, Kochukhet, Mohakhali and Dhaka citywide',
      'https://aalokhealthcare.com/service-ambulance.php', current_date, 'Active'),

    ('Dhaka Central International Medical College Hospital Ambulance', null, '01409-967532', '10651', 'Critical and non-critical patient transfer',
      'Shyamoli', '2/1 Ring Road, Shyamoli, Dhaka 1207', 'Dhaka', 'Dhaka Central International Medical College Hospital', '24/7', 'Dhaka citywide',
      'https://dcimch.com/hospital/contact/', current_date, 'Active'),

    ('Holy Family Hospital Emergency & Ambulance', null, '01716-346930', '02-41031875-8', 'Hospital ambulance',
      'Moghbazar / Eskaton', 'Eskaton Garden Road, Moghbazar, Dhaka', 'Dhaka', 'Holy Family Red Crescent Medical College Hospital', '24/7 emergency & ambulance', 'Dhaka citywide',
      'https://holyfamily.com.bd/about/message-from-director', current_date, 'Active'),

    ('Al-Noor General Hospital Ambulance', null, '01408-900100', '01315-595405 / 01408-900200', 'Hospital ambulance',
      'Jatrabari / Demra', 'The Saiful Center, Farmer More Chowrasta, Konapara Road, Jatrabari, Demra, Dhaka 1362', 'Dhaka', 'Al-Noor General Hospital', '24/7 emergency service', 'Dhaka citywide and nationwide',
      'https://www.alnoorgeneralhospital.com/contact', current_date, 'Active'),

    ('National Ambulance Service Mirpur', null, '01791-229290', null, 'Emergency / ICU ambulance',
      'Mirpur', 'Mirpur, Dhaka', 'Dhaka', null, '24/7', 'Dhaka citywide and nationwide',
      'https://mirpurambulance.com/', current_date, 'Active'),

    ('AmbuFast', null, '09678-911911', null, 'Ambulance booking service',
      'Uttara', 'Plot 16, Road 13, Sector 4, Uttara, Dhaka 1230', 'Dhaka', null, '24/7', 'Dhaka citywide',
      'https://ambufast.com/', current_date, 'Active'),

    ('Shihab Ambulance Service', null, '01725-727979', '01975-727979', 'AC / non-AC ambulance',
      'Uttara', 'Uttara Adhunik Medical College & Hospital area, Uttara, Dhaka', 'Dhaka', null, '24/7', 'Uttara and Dhaka citywide',
      'https://ambulanceservicesdhaka.com/', current_date, 'Active'),

    ('Prime General Hospital Ambulance', null, '01718-559633', null, 'Hospital ambulance',
      'Mohammadpur', '1/1 Gajnabi Road, College Gate, Mohammadpur, Dhaka 1207', 'Dhaka', 'Prime General Hospital & Digital Diagnostic Center', '24/7 hospital hotline', 'Mohammadpur and nearby Dhaka areas',
      'https://primehospital.net/', current_date, 'Active'),

    ('Best One Hospital Emergency Ambulance', null, '01958-586900', '09647-000800', 'Emergency ambulance',
      'Khilgaon / Malibagh', 'Malibag, Chowdhury Para, Khilgaon, Dhaka 1219', 'Dhaka', 'Best One Hospital', '24/7', 'Dhaka citywide',
      'https://www.bestonehospital.com/', current_date, 'Active'),

    ('Square Hospitals Emergency Ambulance', null, '10616', '09610-010616', 'Ambulance / air ambulance',
      'West Panthapath', '18/F Bir Uttam Qazi Nuruzzaman Sarak, West Panthapath, Dhaka 1205', 'Dhaka', 'Square Hospitals Ltd.', '24/7 emergency service', 'Dhaka citywide',
      'https://appointment.squarehospital.com/page/11/square-emergency-centre', current_date, 'Active'),

    ('BIRDEM Ambulance Information', null, '02-41060501', 'Ext 2302', 'Hospital ambulance information / dispatch',
      'Shahbag', '122 Kazi Nazrul Islam Avenue, Shahbag, Dhaka 1000', 'Dhaka', 'BIRDEM General Hospital', '24/7 ambulance information', 'Shahbag and Dhaka citywide',
      'https://www.birdembd.org/contactUs', current_date, 'Active'),

    ('BRB Hospitals Ambulance', null, '10647', null, '24/7 advanced life-support ambulance',
      'Panthapath', '77 Panthapath, Dhaka 1215', 'Dhaka', 'BRB Hospitals Limited', '24/7', 'Dhaka citywide',
      'https://brbhospital.com/department/32', current_date, 'Active')
)
insert into public.ambulances(
  service_name, driver_name, driver_phone, alternate_phone, ambulance_type,
  location, address, city, hospital_name, availability, coverage,
  source_url, verified_on, status
)
select * from seed s
where not exists (
  select 1 from public.ambulances a
  where regexp_replace(coalesce(a.driver_phone,''), '[^0-9]', '', 'g') =
        regexp_replace(coalesce(s.driver_phone,''), '[^0-9]', '', 'g')
     or lower(a.service_name) = lower(s.service_name)
);

create or replace function public.search_public_ambulances(
  location_filter text default ''
)
returns setof jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with ranked as (
    select
      a.*,
      case
        when length(trim(location_filter)) = 0 then 2
        when lower(concat_ws(' ', coalesce(a.location,''), coalesce(a.city,''), coalesce(a.address,''), coalesce(a.hospital_name,'')))
          like '%' || lower(trim(location_filter)) || '%' then 0
        when lower(coalesce(a.coverage,'')) like '%dhaka citywide%' then 1
        else 3
      end as location_rank
    from public.ambulances a
    where a.status = 'Active'
      and (
        length(trim(location_filter)) = 0
        or lower(concat_ws(' ', coalesce(a.location,''), coalesce(a.city,''), coalesce(a.address,''), coalesce(a.hospital_name,'')))
          like '%' || lower(trim(location_filter)) || '%'
        or lower(coalesce(a.coverage,'')) like '%dhaka citywide%'
      )
  )
  select jsonb_build_object(
    'id', a.id,
    'service_name', a.service_name,
    'driver_name', a.driver_name,
    'driver_phone', a.driver_phone,
    'alternate_phone', a.alternate_phone,
    'ambulance_type', a.ambulance_type,
    'location', a.location,
    'address', a.address,
    'city', a.city,
    'hospital_name', a.hospital_name,
    'availability', a.availability,
    'coverage', a.coverage,
    'source_url', a.source_url,
    'verified_on', a.verified_on
  )
  from ranked a
  order by a.location_rank, a.service_name, a.id
  limit 20;
$$;

revoke all on function public.search_public_ambulances(text) from public;
grant execute on function public.search_public_ambulances(text) to anon;
grant execute on function public.search_public_ambulances(text) to authenticated;

commit;
