-- Extend doctor directory records with HCCBD-relevant profile fields.
-- Unknown values intentionally remain NULL; do not infer medical/provider facts.

alter table public.doctors
  add column if not exists gender text
    check (gender is null or gender in ('Female', 'Male', 'Other')),
  add column if not exists sub_specialty text,
  add column if not exists chamber_name text,
  add column if not exists chamber_address text,
  add column if not exists area text,
  add column if not exists district text,
  add column if not exists follow_up_fee numeric
    check (follow_up_fee is null or follow_up_fee >= 0),
  add column if not exists available_days text,
  add column if not exists consultation_type text
    check (consultation_type is null or consultation_type in ('Online', 'Chamber', 'Both')),
  add column if not exists conditions_treated text;

create index if not exists doctors_active_district_area_idx
  on public.doctors (district, area)
  where status = 'Active';

update public.doctors
set district = 'Dhaka'
where district is null
  and (
    coalesce(location, '') ilike '%Dhaka%'
    or coalesce(hospital_name, '') ilike '%Dhaka%'
  );
