-- Ensure admin-only booking contacts exist for the verified Dhaka caregiver providers added in batch 2.
insert into public.caregiver_private_contacts (caregiver_id, phone, email, updated_at, internal_notes)
select c.id, v.phone, v.email, now(), 'Booking contact from official provider website; checked 2026-09-19.'
from public.caregivers c
join (values
  ('Waada Wellness Care', '+8801928484828', 'info@waada.care'),
  ('BD Home Care', '01779076677 / 01611977881', 'mail@bdhomecare.com'),
  ('Care Excellence', '+8801339929496 / +8801332859355', 'info@care-excellence.com'),
  ('Alok Service', '+8801601701865', 'info@alokservice.com'),
  ('Health Home Care Services BD', '01930355045 / 01304457650', 'healthhomecareservices18@gmail.com'),
  ('Dhaka Home Care BD', '+8801766149264 / +8801601112245', 'info@dhakahomecare.com.bd')
) as v(full_name, phone, email)
  on lower(trim(c.full_name)) = lower(trim(v.full_name))
on conflict (caregiver_id) do update
set phone=excluded.phone,
    email=excluded.email,
    updated_at=excluded.updated_at,
    internal_notes=excluded.internal_notes;
