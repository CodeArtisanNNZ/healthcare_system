begin;

-- More area enrichment from the DGHS Facility Registry.
update public.hospitals set location='Kafrul / Mirpur 14, Dhaka, Bangladesh'
where lower(name) = 'ahsania mission cancer and general hospital';

update public.hospitals set location='Dhanmondi / Mohammadpur, Dhaka, Bangladesh'
where lower(name) = 'bangladesh eye hospital & institute';

update public.hospitals set location='Dhanmondi, Dhaka, Bangladesh'
where lower(name) in ('central hospital ltd.','central hospital ltd');

update public.hospitals set location='Bhasan Tek / Mirpur 14, Dhaka, Bangladesh'
where lower(name) = 'dhaka dental college hospital';

update public.hospitals set location='Paltan, Dhaka, Bangladesh'
where lower(name) = 'islami bank central hospital';

update public.hospitals set location='Mohammadpur, Dhaka, Bangladesh'
where lower(name) = 'islamia eye hospital';

update public.hospitals set location='Tejgaon, Dhaka, Bangladesh'
where lower(name) = 'national institute of ent';

update public.hospitals set location='Kotwali / Mitford, Dhaka, Bangladesh'
where lower(name) = 'sir salimullah medical college mitford hospital';

-- Additional active facilities in Dhaka city found in the DGHS registry.
with seed(name, location, email, category, description) as (
  values
    ('Bangladesh Specialized Hospital Ltd. (BSHL)','Adabor, Dhaka, Bangladesh','tafhimur.83@gmail.com','Specialized','DGHS Facility Registry, facility ID 25409.'),
    ('BRB Hospitals Limited','Sher-e-Bangla Nagar, Dhaka, Bangladesh','smmsafiul@gmail.com','General / Multidisciplinary','DGHS Facility Registry, facility ID 25411.'),
    ('The Dhaka Islamia General Hospital and Diagnostic Center','Demra, Dhaka, Bangladesh',null,'General / Multidisciplinary','DGHS Facility Registry, facility ID 25414.'),
    ('Al-Helal Specialized Hospital Limited','Kafrul, Dhaka, Bangladesh','ahshcorp@gmail.com','Specialized','DGHS Facility Registry, facility ID 25406.'),
    ('Tejgaon Health Complex, Dhaka','Tejgaon, Dhaka, Bangladesh','tejgaon@uhfpo.dghs.gov.bd','General / Multidisciplinary','DGHS Facility Registry, facility ID 53; government 31-bed hospital.'),
    ('TB Control And Training Institute','Kotwali, Dhaka, Bangladesh','tbcti@hospi.dghs.gov.bd','Chest & Respiratory','DGHS Facility Registry, facility ID 54; chest disease hospital.')
)
insert into public.hospitals(name, location, email, category, description, status)
select s.name, s.location, s.email, s.category, s.description, 'Active'
from seed s
where not exists (
  select 1 from public.hospitals h
  where lower(trim(h.name)) = lower(trim(s.name))
);

commit;
