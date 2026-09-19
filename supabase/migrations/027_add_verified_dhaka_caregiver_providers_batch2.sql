
begin;

with new_providers (
  full_name, provider_address, location, service_areas, care_type, patient_types,
  services, shift_types, availability, supplied_genders, fee_per_day,
  qualification, source_or_agency, verification_status, verified_on, phone, email
) as (
  values
  (
    'Waada Wellness Care',
    '65/5 Shahjadpur, Osman Gani Road, Gulshan Lake Side, Badda, Dhaka, Bangladesh',
    'Badda, Dhaka',
    'Dhaka city',
    'Home nursing',
    'Older adults; dementia; post-hospital patients; chronic illness; bedridden and high-care patients',
    'Home caregiving; customized nursing; dementia care; geriatric care; companion care; respite care; post-hospital care; wound care; stroke recovery; palliative and respiratory support',
    'Flexible home care and nursing shifts',
    'Contact provider for current availability',
    'Male and female',
    1000,
    'Home healthcare organization',
    'Official website checked 2026-09-19: https://waada.care/',
    'Verified',
    '2026-09-19'::date,
    '+8801928484828',
    'info@waada.care'
  ),
  (
    'BD Home Care',
    '5/4 Salimullah Road, Mohammadpur, Dhaka, Bangladesh',
    'Mohammadpur, Dhaka',
    'Dhaka city and wider Bangladesh by arrangement',
    'General personal care',
    'Older adults; dementia; disability; post-hospital patients; long-term patient care',
    'Basic caregiver; patient/disability care; elderly care; caregiver couple; NG-tube feeding support; physiotherapy; child care',
    '12-hour and 24-hour options; monthly care',
    'Contact provider for current availability',
    'Male and female',
    800,
    'Caregiver and home-care agency',
    'Official website checked 2026-09-19: https://bdhomecare.com/',
    'Verified',
    '2026-09-19'::date,
    '01779076677 / 01611977881',
    'mail@bdhomecare.com'
  ),
  (
    'Care Excellence',
    'Dhaka, Bangladesh',
    'Dhaka',
    'Dhaka city',
    'Elder companion',
    'Older adults; dementia or Parkinson''s; post-hospital recovery; bedridden patients',
    'Companion care; recovery care; intensive caregiver support; dementia and Parkinson''s care; personal care; medicine reminders; mobility support',
    'Daily home-care placements; contact provider for shift options',
    'Contact provider for current availability',
    'Male and female',
    1100,
    'Home care service',
    'Official website checked 2026-09-19: https://care-excellence.com/services/elderly-care',
    'Verified',
    '2026-09-19'::date,
    '+8801339929496 / +8801332859355',
    'info@care-excellence.com'
  ),
  (
    'Alok Service',
    '105/3 Middle Paickpara, Mirpur-10, Dhaka 1216, Bangladesh',
    'Mirpur, Dhaka',
    'Dhaka city',
    'Home nursing',
    'Post-surgery patients; chronic illness; elderly patients; palliative patients',
    'Registered nurse home care; wound care; IV therapy; medication management; health monitoring; post-surgery care; palliative care; home care support',
    'Home nursing by booking',
    'Contact provider for current availability',
    'Male and female',
    null,
    'Home care and nursing service',
    'Official website checked 2026-09-19: https://alokservice.com/services/nursing/',
    'Verified',
    '2026-09-19'::date,
    '+8801601701865',
    'info@alokservice.com'
  ),
  (
    'Health Home Care Services BD',
    'House 354, Nayanagar North, Coca-Cola Tekbari, Vatara, Dhaka 1212, Bangladesh',
    'Vatara, Dhaka',
    'Dhaka city',
    'Home nursing',
    'Older adults; patients needing nursing; newborns; rehabilitation patients',
    'Home nursing; caregiver support; baby care; elderly care; physiotherapy; oxygen support; medical equipment sale and rent',
    '8-hour, 12-hour and 24-hour home care',
    'Contact provider for current availability',
    'Male and female',
    null,
    'Home healthcare service organization',
    'Official website checked 2026-09-19: https://healthhomecareservicesbd.com/',
    'Verified',
    '2026-09-19'::date,
    '01930355045 / 01304457650',
    'healthhomecareservices18@gmail.com'
  ),
  (
    'Dhaka Home Care BD',
    'House 12, Road 6, Turag City, Mirpur-1, Dhaka 1216, Bangladesh',
    'Mirpur, Dhaka',
    'Dhaka city',
    'Home nursing',
    'Older adults; patients requiring caregiver support; newborns; rehabilitation patients',
    'Home nursing; home caregiver; elderly home care; baby home care; physiotherapy home care; attendant care; emergency support',
    'Home care by booking',
    'Contact provider for current availability',
    'Male and female',
    null,
    'Nursing and home-care agency',
    'Official website checked 2026-09-19: https://dhakahomecarebd.com/',
    'Verified',
    '2026-09-19'::date,
    '+8801766149264 / +8801601112245',
    'info@dhakahomecare.com.bd'
  )
),
ins as (
  insert into public.caregivers (
    full_name, provider_type, provider_address, location, service_areas, care_type,
    patient_types, services, shift_types, availability, supplied_genders,
    fee_per_day, qualification, source_or_agency, verification_status,
    verified_on, status
  )
  select
    n.full_name, 'Organization', n.provider_address, n.location, n.service_areas,
    n.care_type, n.patient_types, n.services, n.shift_types, n.availability,
    n.supplied_genders, n.fee_per_day, n.qualification, n.source_or_agency,
    n.verification_status, n.verified_on, 'Active'
  from new_providers n
  where not exists (
    select 1 from public.caregivers c
    where lower(trim(c.full_name)) = lower(trim(n.full_name))
  )
  returning id, full_name
)
insert into public.caregiver_private_contacts (caregiver_id, phone, email, updated_at, internal_notes)
select c.id, n.phone, n.email, now(), 'Booking contact from official provider website; checked 2026-09-19.'
from new_providers n
join public.caregivers c on lower(trim(c.full_name)) = lower(trim(n.full_name))
on conflict (caregiver_id) do update
set phone = excluded.phone,
    email = excluded.email,
    updated_at = now(),
    internal_notes = excluded.internal_notes;

commit;
