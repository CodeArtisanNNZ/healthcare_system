-- Add 25 additional Dhaka caregiver provider organizations from current official
-- websites and local-business listings checked on 2026-09-19.
-- Public caregiver rows intentionally keep phone/email null; booking contacts are
-- stored in caregiver_private_contacts for authenticated administrators.

begin;

with providers(
  full_name, location, provider_address, services, care_type, patient_types,
  shift_types, availability, service_areas, supplied_genders, source_or_agency,
  verification_status
) as (
  values
  ('ACRO Medical Limited','Aftabnagar, Dhaka','Plot-15, Road-03, Block-G, Sector-01, Aftabnagar, Badda, Dhaka-1212, Bangladesh','Home nursing and caregiving, elderly care, care coordination, doctor home visit, ambulance and oxygen support','Home nursing, Elder companion, Dementia support, Post-stroke and paralysis support, Bedridden patient care, Post-operative care, General personal care','Older adult, Dementia or Alzheimer''s, Stroke or paralysis, Bedridden patient, Post-surgery patient, Chronic illness, General support','12-hour, 24-hour; confirm exact staffing with provider','Contact provider; emergency support includes 24/7 services','Dhaka','Confirm with provider','Official website checked 2026-09-19: https://acromedical.com/home-nursing','Directory checked'),
  ('Patient Care Home BD','Gulshan-2, Dhaka','Ka-4, Kalachandpur Main Road, Gulshan-2, Dhaka-1212, Bangladesh','Caregiver service, nursing home care, elderly care, bedridden care, post-operative care, physiotherapy and doctor home visit','Home nursing, Elder companion, Post-stroke and paralysis support, Bedridden patient care, Mobility and transfer assistance, Post-operative care, General personal care','Older adult, Stroke or paralysis, Bedridden patient, Post-surgery patient, Chronic illness, General support','Day, night and 24-hour support','24/7 call support','Dhaka','Confirm with provider','Official website checked 2026-09-19: https://www.patientcarehomebd.com/','Directory checked'),
  ('Nursing Home Care Service','Mirpur-2, Dhaka','House 12, Road 5, Block A, Mirpur-2, Dhaka-1216, Bangladesh','Home nursing, trained caregivers, elderly care, post-surgery recovery, ICU-discharge and bedridden patient support','Home nursing, Elder companion, Post-stroke and paralysis support, Bedridden patient care, Post-operative care, General personal care','Older adult, Stroke or paralysis, Bedridden patient, Post-surgery patient, Chronic illness, General support','12-hour and 24-hour; contact provider for exact options','24/7 contact','Dhaka','Confirm with provider','Official website checked 2026-09-19: https://nursinghomecareservice.com/contact-us/','Directory checked'),
  ('Safwan Home Care','Mirpur-1, Dhaka','Bowbazar, Shah Alibag, Mirpur-1, Dhaka, Bangladesh','Home nursing, patient care and trained caregiver support','Home nursing, Bedridden patient care, Post-operative care, General personal care','Older adult, Bedridden patient, Post-surgery patient, Chronic illness, General support','12-hour and 24-hour','24/7 service advertised','Dhaka','Confirm with provider','Official website checked 2026-09-19: https://safwanhomecare.com/','Directory checked'),
  ('Maisha Care','Nadda, Baridhara, Dhaka','Ka-38, J.B. Tower, Progati Sarani, Nadda, Baridhara, Dhaka-1229, Bangladesh','Home healthcare, nursing, caregiver, newborn care, old age care, physiotherapy, doctor home visit and ambulance support','Home nursing, Elder companion, Bedridden patient care, Post-operative care, Mother and newborn support, General personal care','Older adult, Bedridden patient, Post-surgery patient, Mother and newborn, Chronic illness, General support','8-hour, 12-hour and 24-hour options advertised','Contact provider','Dhaka including Gulshan, Banani, Uttara and Mirpur','Confirm with provider','Official website checked 2026-09-19: https://maishacare.com/','Directory checked'),
  ('Saleha Care','Dhanmondi, Dhaka','156/2 Crescent Road, Dhanmondi, Dhaka-1205, Bangladesh','Home nursing, elderly care, patient care, caregiver support, medical assistant, post-hospital care and physiotherapy','Home nursing, Elder companion, Post-stroke and paralysis support, Bedridden patient care, Mobility and transfer assistance, Post-operative care, General personal care','Older adult, Stroke or paralysis, Bedridden patient, Post-surgery patient, Person with disability, Chronic illness, General support','Shift-based and 24/7 live-in support depending on availability','24/7 on-demand support advertised','Dhaka','Male and female caregivers stated as available subject to availability','Official website checked 2026-09-19: https://www.salehacare.com/contact-us','Directory checked'),
  ('Universal Services BD','Bashundhara R/A, Dhaka','492/20 Salam Tower, Apollo Road, Bashundhara R/A, Dhaka-1229, Bangladesh','Patient attendants, caregivers, home nursing, mobility, hygiene, medication monitoring and hospital accompaniment','Home nursing, Elder companion, Bedridden patient care, Mobility and transfer assistance, Post-operative care, General personal care','Older adult, Bedridden patient, Post-surgery patient, Chronic illness, General support','8-hour, 12-hour and 24-hour options advertised','24/7 quality home care advertised','Dhaka','Confirm with provider','Official website checked 2026-09-19: https://www.universalservicesbd.com/','Directory checked'),
  ('Caregiver Connection Ltd.','Dhaka','16 Haji Dil Mohammad Ave, Dhaka, Bangladesh','Home health care and caregiver support','Home nursing, Elder companion, General personal care','Older adult, Chronic illness, General support','Confirm with provider','Business listing shows 24-hour operation','Dhaka','Confirm with provider','Current Dhaka local-business listing checked 2026-09-19','Directory checked'),
  ('Home Care Service Bangladesh Ltd','Shekhertek, Dhaka','Shekhertek-8, Dhaka-1207, Bangladesh','Home health support; confirm caregiver and nursing scope directly','Home nursing, General personal care','General support','Confirm with provider','Business listing indicates 24-hour operation','Dhaka','Confirm with provider','Current Dhaka local-business listing checked 2026-09-19','Directory checked'),
  ('Health Asia Ltd','Mirpur, Dhaka','Suite-39, Level-4, Mukto Bangla Shopping Complex, Dhaka-1216, Bangladesh','Home health care and nursing-home support','Home nursing, General personal care','Older adult, Chronic illness, General support','Confirm with provider','Business listing indicates 24-hour operation','Dhaka','Confirm with provider','Current Dhaka local-business listing checked 2026-09-19','Directory checked'),
  ('Farhan Caregiver & Medical Equipment Home Service','Dhaka','Dhaka-1212, Bangladesh','Caregiver, nursing-agency and medical-equipment home support','Home nursing, General personal care','Older adult, Bedridden patient, Chronic illness, General support','Confirm with provider','Business listing indicates 24-hour operation','Dhaka','Confirm with provider','Current Dhaka local-business listing checked 2026-09-19','Directory checked'),
  ('Patient Home Care','Middle Badda, Dhaka','Sha-37, Middle Badda, 1st Floor, Dhaka-1212, Bangladesh','Nursing agency and patient home care','Home nursing, General personal care','Older adult, Bedridden patient, Chronic illness, General support','Confirm with provider','Business listing indicates 24-hour operation','Dhaka','Confirm with provider','Current Dhaka local-business listing checked 2026-09-19','Directory checked'),
  ('Home Patient Care BD','Gulshan, Dhaka','121D Gulshan Avenue, Dhaka-1212, Bangladesh','Nursing agency / home patient care','Home nursing, General personal care','General support','Confirm with provider','Confirm with provider','Dhaka','Confirm with provider','Current Dhaka local-business listing checked 2026-09-19','Directory checked'),
  ('Patient Care BD','Kallyanpur, Dhaka','Kallyanpur Road No. 3, Dhaka, Bangladesh','Patient support / local medical services','General personal care','General support','Confirm with provider','Business listing indicates 24-hour operation','Dhaka','Confirm with provider','Current Dhaka local-business listing checked 2026-09-19','Directory checked'),
  ('My Nursing Services - Patient Care & Caregiver Services','Dhaka','Mizan Tower, 1/5, Dhaka-1207, Bangladesh','Patient care, caregiver, home health, nursing and hospice support','Home nursing, Elder companion, Bedridden patient care, Post-operative care, General personal care','Older adult, Bedridden patient, Post-surgery patient, Chronic illness, General support','Confirm with provider','Business listing indicates 24-hour operation','Dhaka','Confirm with provider','Current Dhaka local-business listing checked 2026-09-19','Directory checked'),
  ('Patient Home Service','Dhanmondi, Dhaka','Road No. 5, Dhaka-1205, Bangladesh','Patient home support / local medical services','General personal care','General support','Confirm with provider','Business listing indicates 24-hour operation','Dhaka','Confirm with provider','Current Dhaka local-business listing checked 2026-09-19','Directory checked'),
  ('Homepital - Doctor Home Visit Dhaka','Uttara, Dhaka','Road No. 4, Uttara, Dhaka-1230, Bangladesh','Home health care and home-help service; doctor home visits','Home nursing, General personal care','Chronic illness, General support','Confirm with provider','Business listing indicates 24-hour operation','Dhaka','Confirm with provider','Current Dhaka local-business listing checked 2026-09-19','Directory checked'),
  ('Caregiver Home Services','Mirpur, Dhaka','House-02, Road-02, Dhaka-1216, Bangladesh','Caregiver home support','Elder companion, General personal care','Older adult, General support','Confirm with provider','Business listing indicates 24-hour operation','Dhaka','Confirm with provider','Current Dhaka local-business listing checked 2026-09-19','Directory checked'),
  ('Sheba Lagbe','Mirpur-11, Dhaka','1st Floor, Ejab Islam Tower, Plot 08, Block A, Mirpur-11, Dhaka-1216, Bangladesh','Home health care, nursing agency and medical-equipment support','Home nursing, General personal care','Older adult, Chronic illness, General support','Confirm with provider','Business listing indicates 24-hour operation','Dhaka','Confirm with provider','Current Dhaka local-business listing checked 2026-09-19','Directory checked'),
  ('Teresa Healthcare Services','Mirpur-10, Dhaka','House 29, Block-Kha, Boundary Road, Senpara Porbota, Mirpur-10, Dhaka-1216, Bangladesh','24-hour nursing, male/female attendant service, specialist consultation, physiotherapy and ambulance support','Home nursing, Elder companion, Bedridden patient care, General personal care','Older adult, Bedridden patient, Chronic illness, General support','24-hour nursing and attendant service advertised','7-day support line advertised','Dhaka','Male and female attendants advertised','Official website checked 2026-09-19: https://www.teresahealthcare.org/','Directory checked'),
  ('Well-Being Health Care','Mirpur, Dhaka','Mirpur, Dhaka-1216, Bangladesh','Caregivers, nurses, critical patient care, post-stroke management, hospital/dialysis attendant and home therapy','Home nursing, Elder companion, Post-stroke and paralysis support, Bedridden patient care, General personal care','Older adult, Stroke or paralysis, Bedridden patient, Chronic illness, General support','Long/short-term care; confirm exact shifts','Contact provider','Dhaka','Confirm with provider','Official website checked 2026-09-19: https://www.wellbeingbd.com/','Directory checked'),
  ('eSastho','Mirpur-1, Dhaka','Mazar Road, Mirpur-1, Dhaka-1216, Bangladesh','Nurse home services and healthcare coordination','Home nursing','Chronic illness, General support','Confirm with provider','Contact provider','Dhaka','Confirm with provider','Official website checked 2026-09-19: https://esastho.com/','Directory checked'),
  ('Seba Nursing Home Care Ltd.','Shahjadpur, Gulshan, Dhaka','Morjina Villa, House 09, Bijoypath, Shahjadpur, Gulshan, Dhaka-1212, Bangladesh','Patient caretaker, newborn care and nursing-home care','Home nursing, Elder companion, Mother and newborn support, General personal care','Older adult, Mother and newborn, General support','Confirm with provider','Contact provider','Dhaka','Confirm with provider','Website checked 2026-09-19: https://caregiverserviceprovider.com/page-details/28','Directory checked'),
  ('Hospice Bangladesh','Dhanmondi, Dhaka','Level-6, House-36 (New), Plot-275/K, Road-16 (New), Road-27 (Old), Dhanmondi, Dhaka-1207, Bangladesh','Home health care, palliative care, nurses and caregivers for home-bound patients','Home nursing, Dementia support, Post-stroke and paralysis support, Bedridden patient care, Palliative comfort support, General personal care','Older adult, Dementia or Alzheimer''s, Stroke or paralysis, Bedridden patient, Chronic illness, General support','12-hour and 24-hour nursing options advertised','Home-based services in Dhaka','Dhaka city','Confirm with provider','Official website checked 2026-09-19: https://hospicebangladesh.com/home-health-care/','Directory checked'),
  ('HealthCo','Bosila, Mohammadpur, Dhaka','84/1, Road 3, Shopnodhara Housing, Bosila, Mohammadpur, Dhaka, Bangladesh','Nurse home service, family doctors, diagnostics and healthcare logistics','Home nursing','Chronic illness, General support','Confirm with provider','Listed opening hours and 24/7 healthcare services; confirm nurse availability','Dhaka','Confirm with provider','Official website checked 2026-09-19: https://healthco.care/','Directory checked')
)
insert into public.caregivers (
  full_name, gender, experience, qualification, services, location, fee_per_day,
  phone, email, availability, status, care_type, patient_types, shift_types,
  languages, verification_status, source_or_agency, provider_type,
  provider_address, service_areas, supplied_genders, verified_on
)
select
  p.full_name,
  null,
  null,
  'Provider organization — individual worker credentials must be confirmed before assignment',
  p.services,
  p.location,
  null,
  null,
  null,
  p.availability,
  'Active',
  p.care_type,
  p.patient_types,
  p.shift_types,
  null,
  p.verification_status,
  p.source_or_agency,
  'Organization',
  p.provider_address,
  p.service_areas,
  p.supplied_genders,
  date '2026-09-19'
from providers p
where not exists (
  select 1 from public.caregivers c
  where lower(trim(c.full_name)) = lower(trim(p.full_name))
);

with contacts(full_name, phone, email, internal_notes) as (
  values
  ('ACRO Medical Limited','01315635325 / 09666740074',null,'Public booking/contact lines from ACRO Medical official website, checked 2026-09-19. Provider identity/source checked; verify the assigned individual caregiver credentials and current availability before confirmation.'),
  ('Patient Care Home BD','01315092095 / 01739508350','caregiveragencybd@gmail.com','Public booking contacts from official website, checked 2026-09-19. Confirm current staffing, pricing and worker credentials before assignment.'),
  ('Nursing Home Care Service','01712639669','nursinghomecareservice.com@gmail.com','Public booking contacts from official website, checked 2026-09-19. Verify the assigned nurse/caregiver and current availability before confirmation.'),
  ('Safwan Home Care','01711759612 / 01711759613','info@safwanhomecare.com','Public booking contacts from official website, checked 2026-09-19. Background-check claims are provider statements; verify worker credentials independently before assignment.'),
  ('Maisha Care','01315092095 / 01718930914','info@maishacare.com','Public booking contacts from official website, checked 2026-09-19. Confirm assigned worker identity and current service area before assignment.'),
  ('Saleha Care','01947911345','salehacare24@gmail.com','Public booking contacts from official website, checked 2026-09-19. Confirm current pricing, shift and individual caregiver credentials before assignment.'),
  ('Universal Services BD','01750536605','info@universalservices.com','Public booking contacts from official website, checked 2026-09-19. Confirm individual caregiver/nurse credentials before assignment.'),
  ('Caregiver Connection Ltd.','01750907182',null,'Public business contact from current local-business listing checked 2026-09-19. Service details are directory-level only; confirm exact caregiver scope and credentials before assignment.'),
  ('Home Care Service Bangladesh Ltd','01321081941',null,'Public business contact from current local-business listing checked 2026-09-19. Confirm current caregiver services and worker credentials before assignment.'),
  ('Health Asia Ltd','01829282228',null,'Public business contact from current local-business listing checked 2026-09-19. Confirm exact caregiver service and credentials before assignment.'),
  ('Farhan Caregiver & Medical Equipment Home Service','01680055030',null,'Public business contact from current local-business listing checked 2026-09-19. Confirm exact staffing and individual worker credentials before assignment.'),
  ('Patient Home Care','01716157621',null,'Public business contact from current local-business listing checked 2026-09-19. Confirm caregiver availability and worker credentials before assignment.'),
  ('Home Patient Care BD','01568400418',null,'Public business contact from current local-business listing checked 2026-09-19. Confirm exact service scope and worker credentials before assignment.'),
  ('Patient Care BD','01517112167',null,'Public business contact from current local-business listing checked 2026-09-19. Confirm whether a trained caregiver is available for the requested case before assignment.'),
  ('My Nursing Services - Patient Care & Caregiver Services','01712676055',null,'Public business contact from current local-business listing checked 2026-09-19. Confirm exact shift, fees and individual caregiver credentials before assignment.'),
  ('Patient Home Service','01926105715',null,'Public business contact from current local-business listing checked 2026-09-19. Confirm trained caregiver availability and credentials before assignment.'),
  ('Homepital - Doctor Home Visit Dhaka','01704525408',null,'Public business contact from current local-business listing checked 2026-09-19. Home-help category is listed, but confirm caregiver availability specifically before assignment.'),
  ('Caregiver Home Services','01729775689',null,'Public business contact from current local-business listing checked 2026-09-19. Confirm exact care scope, fees and caregiver credentials before assignment.'),
  ('Sheba Lagbe','01335065187',null,'Public business contact from current local-business listing checked 2026-09-19. Confirm caregiver availability and worker credentials before assignment.'),
  ('Teresa Healthcare Services','01711458600',null,'Public hotline from official website, checked 2026-09-19. Confirm individual attendant/nurse credentials and availability before assignment.'),
  ('Well-Being Health Care','01701055655','services@wellbeingbd.com','Public contacts from official website, checked 2026-09-19. Confirm current worker credentials and availability before assignment.'),
  ('eSastho','01994032367','info@esastho.com','Official site checked 2026-09-19 lists Nurse Home Services. Confirm whether the requested case needs a nurse versus non-clinical caregiver before assignment.'),
  ('Seba Nursing Home Care Ltd.','01710296622','sebanhcbd44@gmail.com','Public contacts from provider website, checked 2026-09-19. Confirm current operation, staffing and individual caregiver credentials before assignment.'),
  ('Hospice Bangladesh','09606788889','care@hospicebangladesh.com','Official site checked 2026-09-19 states DGHS registration and home-based nurse/caregiver services. Confirm the specific worker and care plan before assignment.'),
  ('HealthCo','01708122391','info@healthco.care','Public contact from official website, checked 2026-09-19. Confirm whether the requested case needs skilled nursing or non-clinical caregiver support before assignment.')
)
insert into public.caregiver_private_contacts (
  caregiver_id, phone, email, internal_notes, updated_at
)
select
  c.id,
  x.phone,
  x.email,
  x.internal_notes,
  now()
from contacts x
join public.caregivers c
  on lower(trim(c.full_name)) = lower(trim(x.full_name))
on conflict (caregiver_id) do update
set phone = excluded.phone,
    email = coalesce(excluded.email, public.caregiver_private_contacts.email),
    internal_notes = excluded.internal_notes,
    updated_at = now();

commit;
