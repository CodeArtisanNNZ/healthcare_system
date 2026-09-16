begin;

-- Enrich existing directory rows whose old source only said "Dhaka" so area
-- search can return them. These areas are based on DGHS Facility Registry
-- records and official mailing locations.
update public.hospitals set location='Dhanmondi, Dhaka, Bangladesh'
where lower(name) like 'anwer khan modern medical college hospital%';

update public.hospitals set location='Mohammadpur, Dhaka, Bangladesh'
where lower(name) = 'bangladesh medical college hospital';

update public.hospitals set location='Sher-e-Bangla Nagar, Dhaka, Bangladesh'
where lower(name) like 'bangladesh shishu hospital%';

update public.hospitals set location='Shahbag, Dhaka, Bangladesh'
where lower(name) = 'dhaka medical college hospital';

update public.hospitals set location='Shahbag, Dhaka, Bangladesh'
where lower(name) like 'holy family red crescent medical college hospital%';

update public.hospitals set location='Mirpur, Dhaka, Bangladesh'
where lower(name) like 'national heart foundation hospital%';

update public.hospitals set location='Mohakhali / Banani, Dhaka, Bangladesh'
where lower(name) like 'national institute of cancer research%';

update public.hospitals set location='Sher-e-Bangla Nagar, Dhaka, Bangladesh'
where lower(name) like 'national institute of cardiovascular diseases%';

update public.hospitals set location='Mohakhali / Banani, Dhaka, Bangladesh'
where lower(name) like 'national institute of diseases of the chest%';

update public.hospitals set location='Sher-e-Bangla Nagar, Dhaka, Bangladesh'
where lower(name) like 'national institute of neurosciences%';

update public.hospitals set location='Sher-e-Bangla Nagar, Dhaka, Bangladesh'
where lower(name) like 'national institute of traumatology%';

update public.hospitals set location='Panthapath / Sher-e-Bangla Nagar, Dhaka, Bangladesh'
where lower(name) like 'square hospitals%';

update public.hospitals set location='Tejgaon Industrial Area, Dhaka, Bangladesh'
where lower(name) in ('samorita hospital ltd.','mh samorita hospital ltd');

update public.hospitals set location='Gulshan, Dhaka, Bangladesh'
where lower(name) = 'united hospital ltd.';

update public.hospitals set location='Dhanmondi, Dhaka, Bangladesh'
where lower(name) = 'northern international medical college hospital';

update public.hospitals set location='Dhanmondi, Dhaka, Bangladesh'
where lower(name) = 'panorama hospital ltd';

-- Additional currently registered Dhaka facilities found in the DGHS registry.
with seed(name, location, email, category, description) as (
  values
    ('Dhaka Cancer and General Hospital Limited','Dhanmondi, Dhaka, Bangladesh','dcghospitaldhaka@gmail.com','Cancer','DGHS Facility Registry, facility ID 26842.'),
    ('Gulshan Clinic Ltd.','Gulshan, Dhaka, Bangladesh','info@gulshanclinicbd.org','General / Multidisciplinary','DGHS Facility Registry, facility ID 30293.'),
    ('Al Mutmainnah Ma O Shishu Hospital','Sabujbag, Dhaka, Bangladesh','abmrh901@gmail.com','Women & Maternity','DGHS Facility Registry, facility ID 26019.')
)
insert into public.hospitals(name, location, email, category, description, status)
select s.name, s.location, s.email, s.category, s.description, 'Active'
from seed s
where not exists (
  select 1 from public.hospitals h
  where lower(trim(h.name)) = lower(trim(s.name))
);

commit;
