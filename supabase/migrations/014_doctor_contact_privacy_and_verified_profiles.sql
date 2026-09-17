alter table public.doctors
  add column if not exists source_url text,
  add column if not exists verified_on date,
  add column if not exists verification_status text not null default 'Unverified'
    check (verification_status in ('Unverified', 'Needs review', 'Verified'));

create table if not exists public.doctor_private_contacts (
  doctor_id uuid primary key references public.doctors(id) on delete cascade,
  phone text,
  email text,
  updated_at timestamptz not null default now()
);

alter table public.doctor_private_contacts enable row level security;
revoke all on table public.doctor_private_contacts from anon, authenticated;
grant select, insert, update, delete on table public.doctor_private_contacts to authenticated;
grant all on table public.doctor_private_contacts to service_role;

drop policy if exists "Admins manage private doctor contacts" on public.doctor_private_contacts;
create policy "Admins manage private doctor contacts"
  on public.doctor_private_contacts
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

insert into public.doctor_private_contacts (doctor_id, phone, email)
select id, nullif(btrim(phone), ''), nullif(btrim(email), '')
from public.doctors
where nullif(btrim(phone), '') is not null or nullif(btrim(email), '') is not null
on conflict (doctor_id) do update
set phone = excluded.phone,
    email = excluded.email,
    updated_at = now();

update public.doctors set phone = null, email = null
where phone is not null or email is not null;

update public.doctors
set qualification = 'MBBS, FCPS (ENT), MS (Otolaryngology), FRCS (Glasgow)',
    specialization = 'ENT & Head Neck Surgery',
    specialty_id = (select id from public.specialties where name = 'ENT Specialist' limit 1),
    source_url = 'https://www.evercarebd.com/en/dhaka/doctors/dr-a-f-m-ekramuddaula',
    verified_on = current_date,
    verification_status = 'Verified'
where lower(full_name) = lower('Dr. A. F. M. Ekramuddaula')
  and hospital_name = 'Evercare Hospital Dhaka';

update public.doctors
set qualification = 'MBBS (DMC), DTCD (DU), MD (Chest)',
    specialization = 'Respiratory Medicine',
    specialty_id = (select id from public.specialties where name = 'Chest Medicine Specialist' limit 1),
    source_url = 'https://www.evercarebd.com/en/dhaka/doctors/prof-dr-rowshne-jahan',
    verified_on = current_date,
    verification_status = 'Verified'
where lower(full_name) = lower('Prof. Dr. Rowshne Jahan')
  and hospital_name = 'Evercare Hospital Dhaka';

update public.doctors
set qualification = 'MBBS, FCPS (BCPS), MS (Obs./Gynae.), Fellowship in Minimally Access Surgery on Gynae Oncology (India)',
    specialization = 'Obstetrics and Gynaecology',
    experience = 30,
    specialty_id = (select id from public.specialties where name = 'Gynaecologist' limit 1),
    source_url = 'https://www.evercarebd.com/en/dhaka/doctors/dr-monowara-begum',
    verified_on = current_date,
    verification_status = 'Verified'
where lower(full_name) = lower('Dr. Monowara Begum')
  and hospital_name = 'Evercare Hospital Dhaka';

update public.doctors
set qualification = 'MBBS (DMC), MD (Cardiology-NICVD), Fellowship in Non-Invasive Cardiology (India)',
    specialization = 'Cardiology Care Centre',
    experience = 11,
    specialty_id = (select id from public.specialties where name = 'Cardiologist' limit 1),
    source_url = 'https://www.evercarebd.com/en/dhaka/doctors/dr-nighat-islam',
    verified_on = current_date,
    verification_status = 'Verified'
where lower(full_name) = lower('Dr. Nighat Islam')
  and hospital_name = 'Evercare Hospital Dhaka';

update public.doctors
set qualification = 'MBBS, MRCP (UK), FRCP, FACC, FSCAI',
    specialization = 'Cardiology Care Centre',
    experience = 30,
    specialty_id = (select id from public.specialties where name = 'Cardiologist' limit 1),
    source_url = 'https://www.evercarebd.com/en/dhaka/doctors/dr-tamzeed-ahmed',
    verified_on = current_date,
    verification_status = 'Verified'
where lower(full_name) = lower('Dr. Tamzeed Ahmed')
  and hospital_name = 'Evercare Hospital Dhaka';

update public.doctors
set qualification = 'MBBS, MD (USA)',
    specialization = 'Psychiatry',
    specialty_id = (select id from public.specialties where name = 'Psychiatrist' limit 1),
    source_url = 'https://www.evercarebd.com/en/dhaka/doctors/dr-nigar-sultana',
    verified_on = current_date,
    verification_status = 'Verified'
where lower(full_name) = lower('Dr. Nigar Sultana')
  and hospital_name = 'Evercare Hospital Dhaka';
