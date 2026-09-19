begin;

alter table public.caregivers
  add column if not exists provider_type text not null default 'Individual',
  add column if not exists provider_address text,
  add column if not exists service_areas text,
  add column if not exists supplied_genders text,
  add column if not exists verified_on date;

alter table public.caregivers
  drop constraint if exists caregivers_provider_type_check,
  add constraint caregivers_provider_type_check
    check (provider_type in ('Individual','Organization'));

alter table public.caregivers
  drop constraint if exists caregivers_verification_status_check,
  add constraint caregivers_verification_status_check
    check (verification_status in ('Needs review','Directory checked','Verified'));

with seed(
  full_name, provider_address, phone, location, services, source_note
) as (
  values
    ('Life Nursing Care - Caregiver','68-69 Concept Tower (Lift 3), Green Road, Panthapath Rd, Dhaka 1205, Bangladesh','+8801886283555','Dhaka','Home health care service','Current Dhaka business listing checked 2026-09-19'),
    ('AGED CARE CENTRE','Block A, Green City, House 30, Road 2, Dhaka 1207, Bangladesh','+8809638700400','Dhaka','Aged care and home health support','Current Dhaka business listing checked 2026-09-19'),
    ('HealthCare At Home Bangladesh','House 11, Road 108, Dhaka 1212, Bangladesh','+8801619848555','Dhaka','Home health care service','Current Dhaka business listing checked 2026-09-19'),
    ('HealYou (Homecare)','Ka-4, Dhaka 1212, Bangladesh','+8801914888111','Dhaka','Home health care service','Current Dhaka business listing checked 2026-09-19'),
    ('Nursing Home Care BD','House 2, Block A, Vatara, Gulshan, Dhaka 1212, Bangladesh','+8801719661366','Dhaka','Nursing agency and home care','Current Dhaka business listing checked 2026-09-19'),
    ('Priyojon Senior Care Center','Lift 9, EDB Trade Centre, 93 Kazi Nazrul Islam Ave, Dhaka 1215, Bangladesh','+8801994888999','Dhaka','Senior care and home health care service','Current Dhaka business listing checked 2026-09-19'),
    ('Caregiver Service BD','65/1 Purana Paltan Line, Dhaka 1000, Bangladesh','+8801830560131','Dhaka','Caregiver, elderly care, patient care, baby care and home nursing','Official website and current Dhaka business listing checked 2026-09-19'),
    ('Al-Bokhari Caregiving Services Ltd.','123/1/2, Kazi Tower, Dhaka 1204, Bangladesh','+8801778654544','Dhaka','Caregiving and nursing agency','Current Dhaka business listing checked 2026-09-19'),
    ('Trust Nursing Home Care','Dhaka 1206, Bangladesh','+8801629861913','Dhaka','Home health care service','Current Dhaka business listing checked 2026-09-19'),
    ('The Best Homecare Service','1 Eidgah Masjid Road, Dhaka 1212, Bangladesh','+8801714177837','Dhaka','Home health care and nursing agency','Current Dhaka business listing checked 2026-09-19'),
    ('Nursing Agency BD','House 14, Sector 7, Road 25, Dhaka 1230, Bangladesh','+8801707372002','Dhaka','Home nursing, caregiver support, elderly care and post-operative care','Official website and current Dhaka business listing checked 2026-09-19'),
    ('Caregivers Agency BD','15/5 Pragati Ave, Dhaka 1229, Bangladesh','+8801404002228','Dhaka','Caregiver, home nursing, elderly care, dementia care, patient and newborn care','Official website and current Dhaka business listing checked 2026-09-19'),
    ('Imran Home Care Pvt. Ltd.','House 2, near Social Islami Bank, Natun Bazar, Vatara, Gulshan-2, Dhaka 1212, Bangladesh','+8801719661366','Dhaka','Nursing agency and home care','Current Dhaka business listing checked 2026-09-19'),
    ('ISRAT CARE GIVERS','15/5 Pragati Ave, Dhaka 1229, Bangladesh','+8801716021021','Dhaka','Caregiver and nursing agency','Current Dhaka business listing checked 2026-09-19'),
    ('Patient Care Home Service BD','3rd Floor, Barishal Plaza, 51/A/KA/5, West Panthapath Rd, Dhaka 1215, Bangladesh','+8801919941450','Dhaka','Patient care and nursing agency','Current Dhaka business listing checked 2026-09-19'),
    ('MyHealth','House 45, Road 14, Block G, Niketon, Dhaka 1212, Bangladesh','+8801805002600','Dhaka','Home health care service','Current Dhaka business listing checked 2026-09-19'),
    ('Dhaka Home Care Agency','House 23, Road 5, Block A, Priyanka Housing, Turag City, Dhaka 1216, Bangladesh','+8801766149264','Dhaka','Home health care service','Current Dhaka business listing checked 2026-09-19'),
    ('Fedelta Home Health Care','185, Lift 7, Muktobangla Shopping Complex, Dhaka 1216, Bangladesh','+8801707937437','Dhaka','Home health care service','Current Dhaka business listing checked 2026-09-19'),
    ('Clara Care Services Ltd','Ka-24, A-Mazid Tower, 7th Floor, Pragati Sarani Road, Dhaka 1229, Bangladesh','+8801938881110','Dhaka','Home health care service','Current Dhaka business listing checked 2026-09-19'),
    ('Doctors Home Care Limited - Uttara','Ground Floor, House 20, Road 05, Sector 13, Uttara Model Town, Dhaka 1230, Bangladesh','+8801754839059','Dhaka','Expert nursing and home care service','Current Dhaka business listing checked 2026-09-19'),
    ('Nursing Home Care Dhaka','Ka-244, Progoti Shoroni, Dhaka 1229, Bangladesh','+8801518499461','Dhaka','Home health care service','Current Dhaka business listing checked 2026-09-19'),
    ('Home and Community Care Limited (HCCL)','4th Floor, Plot 12, Block CWS(C), OTOBI Center, Gulshan South Avenue, Dhaka 1212, Bangladesh','+8809610900000','Dhaka','Home and community health care service','Current Dhaka business listing checked 2026-09-19'),
    ('Doctors Care - Nursing Services & Home Care Services in Dhaka','House 09, Eskaton Garden Road, Dhaka 1000, Bangladesh','+8801716606849','Dhaka','Nursing and home care services','Current Dhaka business listing checked 2026-09-19'),
    ('Caregiver Agency Dhaka','House 181, Road 2, Dhaka 1206, Bangladesh','+8801350840672','Dhaka','Caregiver and nursing agency','Current Dhaka business listing checked 2026-09-19'),
    ('All Samadhan','House 03, Block E, 2nd Floor, Section 02, Dhaka 1216, Bangladesh','+8801711897016','Dhaka','Home health care service','Current Dhaka business listing checked 2026-09-19')
)
insert into public.caregivers (
  full_name, provider_type, gender, experience, qualification, care_type,
  patient_types, services, shift_types, availability, location,
  provider_address, service_areas, supplied_genders, fee_per_day, languages,
  verification_status, verified_on, source_or_agency, status
)
select
  s.full_name, 'Organization', null, null,
  'Caregiver / home-care provider organization', null, null, s.services, null,
  'Contact provider to confirm current caregiver availability',
  s.location, s.provider_address,
  'Dhaka; confirm exact service area with provider',
  'Ask provider for available male/female caregivers',
  null, null, 'Directory checked', date '2026-09-19', s.source_note, 'Active'
from seed s
where not exists (
  select 1 from public.caregivers c
  where lower(trim(c.full_name)) = lower(trim(s.full_name))
);

with seed(full_name, phone) as (
  values
    ('Life Nursing Care - Caregiver','+8801886283555'),
    ('AGED CARE CENTRE','+8809638700400'),
    ('HealthCare At Home Bangladesh','+8801619848555'),
    ('HealYou (Homecare)','+8801914888111'),
    ('Nursing Home Care BD','+8801719661366'),
    ('Priyojon Senior Care Center','+8801994888999'),
    ('Caregiver Service BD','+8801830560131'),
    ('Al-Bokhari Caregiving Services Ltd.','+8801778654544'),
    ('Trust Nursing Home Care','+8801629861913'),
    ('The Best Homecare Service','+8801714177837'),
    ('Nursing Agency BD','+8801707372002'),
    ('Caregivers Agency BD','+8801404002228'),
    ('Imran Home Care Pvt. Ltd.','+8801719661366'),
    ('ISRAT CARE GIVERS','+8801716021021'),
    ('Patient Care Home Service BD','+8801919941450'),
    ('MyHealth','+8801805002600'),
    ('Dhaka Home Care Agency','+8801766149264'),
    ('Fedelta Home Health Care','+8801707937437'),
    ('Clara Care Services Ltd','+8801938881110'),
    ('Doctors Home Care Limited - Uttara','+8801754839059'),
    ('Nursing Home Care Dhaka','+8801518499461'),
    ('Home and Community Care Limited (HCCL)','+8809610900000'),
    ('Doctors Care - Nursing Services & Home Care Services in Dhaka','+8801716606849'),
    ('Caregiver Agency Dhaka','+8801350840672'),
    ('All Samadhan','+8801711897016')
)
insert into public.caregiver_private_contacts (caregiver_id, phone, email, updated_at)
select c.id, s.phone, null, now()
from seed s
join public.caregivers c
  on lower(trim(c.full_name)) = lower(trim(s.full_name))
on conflict (caregiver_id) do update
set phone = excluded.phone,
    updated_at = now();

commit;
