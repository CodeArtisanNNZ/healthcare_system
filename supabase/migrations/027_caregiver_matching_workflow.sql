begin;

alter table public.caregivers
  add column if not exists patient_types text,
  add column if not exists shift_types text,
  add column if not exists languages text,
  add column if not exists verification_status text not null default 'Needs review',
  add column if not exists source_or_agency text,
  add column if not exists internal_notes text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid='public.caregivers'::regclass
      and conname='caregivers_verification_status_check'
  ) then
    alter table public.caregivers
      add constraint caregivers_verification_status_check
      check (verification_status in ('Needs review','Verified'));
  end if;
end $$;

alter table public.caregiver_requests
  add column if not exists caregiver_gender_preference text not null default 'Any',
  add column if not exists patient_type text,
  add column if not exists patient_age_group text,
  add column if not exists mobility_level text,
  add column if not exists service_address text;

alter table public.caregiver_requests
  drop constraint if exists caregiver_requests_care_type_check,
  add constraint caregiver_requests_care_type_check
    check (care_type in (
      'Home nursing',
      'Elder companion',
      'Dementia support',
      'Post-stroke and paralysis support',
      'Bedridden patient care',
      'Mobility and transfer assistance',
      'Post-operative care',
      'Disability support',
      'Mother and newborn support',
      'Palliative comfort support',
      'General personal care'
    ));

alter table public.caregiver_requests
  drop constraint if exists caregiver_requests_duration_check,
  add constraint caregiver_requests_duration_check
    check (duration in (
      'A few hours',
      '1 day',
      '3 days',
      '1 week',
      '2 weeks',
      '1 month',
      'Ongoing support'
    ));

alter table public.caregiver_requests
  drop constraint if exists caregiver_requests_time_period_check,
  add constraint caregiver_requests_time_period_check
    check (time_period in (
      'morning',
      'afternoon',
      'evening',
      'overnight',
      '24-hour',
      'anytime'
    ));

alter table public.caregiver_requests
  drop constraint if exists caregiver_requests_gender_preference_check,
  add constraint caregiver_requests_gender_preference_check
    check (caregiver_gender_preference in ('Any','Female','Male'));

alter table public.caregiver_requests
  drop constraint if exists caregiver_requests_patient_type_check,
  add constraint caregiver_requests_patient_type_check
    check (
      patient_type is null or patient_type in (
        'Older adult',
        'Dementia or Alzheimer''s',
        'Stroke or paralysis',
        'Bedridden patient',
        'Post-surgery patient',
        'Person with disability',
        'Mother and newborn',
        'Chronic illness',
        'General support'
      )
    );

alter table public.caregiver_requests
  drop constraint if exists caregiver_requests_patient_age_group_check,
  add constraint caregiver_requests_patient_age_group_check
    check (
      patient_age_group is null or patient_age_group in (
        'Newborn',
        'Child',
        'Teen',
        'Adult',
        'Older adult'
      )
    );

alter table public.caregiver_requests
  drop constraint if exists caregiver_requests_mobility_level_check,
  add constraint caregiver_requests_mobility_level_check
    check (
      mobility_level is null or mobility_level in (
        'Independent',
        'Needs some help',
        'Wheelchair user',
        'Mostly bedridden',
        'Fully bedridden',
        'Not sure'
      )
    );

create index if not exists caregivers_gender_idx
  on public.caregivers(gender);
create index if not exists caregivers_location_idx
  on public.caregivers(lower(location));
create index if not exists caregiver_requests_status_created_idx
  on public.caregiver_requests(status, created_at desc);

insert into public.caregiver_private_contacts (caregiver_id, phone, email, updated_at)
select id, nullif(btrim(phone), ''), nullif(btrim(email), ''), now()
from public.caregivers
where nullif(btrim(phone), '') is not null
   or nullif(btrim(email), '') is not null
on conflict (caregiver_id) do update
set phone = coalesce(excluded.phone, public.caregiver_private_contacts.phone),
    email = coalesce(excluded.email, public.caregiver_private_contacts.email),
    updated_at = now();

update public.caregivers
set phone = null, email = null
where phone is not null or email is not null;

delete from public.caregivers
where full_name like 'Healthcare Central care coordination roster — %';

commit;
